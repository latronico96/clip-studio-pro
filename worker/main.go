package main

import "log"

func main() {
	cfg := LoadConfig()
	client := NewBackendClient(cfg)
	log.Println("[WORKER] ClipStudio Worker started")
	StartPolling(client, cfg.PollInterval, cfg.WorkerID)
}
