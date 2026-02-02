package main

import (
	"log"
	"time"
)

func StartHeartbeat(
	client *BackendClient,
	jobID string,
	workerID string,
	stop <-chan struct{},
) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			err := client.Heartbeat(jobID, workerID)
			if err != nil {
				log.Println("[HEARTBEAT] error:", err)
			}
		case <-stop:
			log.Println("[HEARTBEAT] stopped", jobID)
			return
		}
	}
}
