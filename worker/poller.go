package main

import (
	"log"
	"time"
)

func StartPolling(client *BackendClient, interval int, workerID string) {
	log.Println("[WORKER] Polling started")

	for {
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

		log.Printf("[WORKER] Job received: id=%s type=%s\n", job.ID, job.Type)

		stopHB := make(chan struct{})
		go StartHeartbeat(client, job.ID, workerID, stopHB)
n
   err := func() error {
       defer close(stopHB)
       return ProcessJob(job, client)
   }()

		close(stopHB)

		if err != nil {
			client.FailJob(job.ID, err)
		} else {
			client.CompleteJob(
				job.ID,
				map[string]any{
					"message": "processed successfully",
				},
				workerID,
			)
		}
	}
}
