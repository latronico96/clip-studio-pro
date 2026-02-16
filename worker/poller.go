package main

import (
	"fmt"
	"log"
	"time"
)

func StartPolling(client *BackendClient, interval int, workerID string) {
	log.Println("[WORKER] Polling started")

	for {
		log.Println("[WORKER] Fetching next job...")

		job, err := client.FetchNextJob()
		if err != nil {
			log.Println("[WORKER] error fetching job:", err)
			time.Sleep(time.Duration(interval) * time.Second)
			continue
		}

		if job == nil {
			log.Println("[WORKER] no jobs, sleeping...")
			time.Sleep(time.Duration(interval) * time.Second * 3)
			continue
		}

		log.Printf(
			"[WORKER] Job received: id=%s type=%s payload=%+v\n",
			job.ID,
			job.Type,
			job.Payload,
		)

		stopHB := make(chan struct{})

		// Heartbeat
		go StartHeartbeat(client, job.ID, workerID, stopHB)

		result, err := func() (res map[string]any, err error) {
			defer func() {
				// 🔥 Captura PANIC (clave)
				if r := recover(); r != nil {
					log.Printf(
						"[WORKER] PANIC in job %s: %v\n",
						job.ID,
						r,
					)
					err = fmt.Errorf("panic: %v", r)
				}

				log.Printf("[WORKER] stopping heartbeat for job %s\n", job.ID)
				close(stopHB)
			}()

			log.Printf("[WORKER] processing job %s\n", job.ID)
			return ProcessJob(job, client)
		}()

		// 🧨 Evita éxito silencioso
		if err == nil && result == nil {
			err = fmt.Errorf("job returned nil result without error")
		}

		if err != nil {
			log.Printf(
				"[WORKER] Job %s FAILED: %v\n",
				job.ID,
				err,
			)

			if failErr := client.FailJob(job.ID, err); failErr != nil {
				log.Printf(
					"[WORKER] Failed to report job failure %s: %v\n",
					job.ID,
					failErr,
				)
			}
		} else {
			log.Printf(
				"[WORKER] Job %s COMPLETED successfully\n",
				job.ID,
			)

			if completeErr := client.CompleteJob(job.ID, result, workerID); completeErr != nil {
				log.Printf(
					"[WORKER] Failed to report job completion %s: %v\n",
					job.ID,
					completeErr,
				)
			}
		}
	}
}
