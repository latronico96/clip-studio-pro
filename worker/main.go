package main

import (
	"github.com/joho/godotenv"
)

func main() {
	 _ = godotenv.Load()
	cfg := LoadConfig()
	client := NewBackendClient(cfg)
	StartPolling(client, cfg.PollInterval, cfg.WorkerID)
}
