package main

import (
	"os"
	"strconv"
)

type Config struct {
	BackendURL   string
	WorkerToken  string
	WorkerID     string
	PollInterval int
}

func LoadConfig() Config {
	interval, _ := strconv.Atoi(getEnv("POLL_INTERVAL", "30"))

	return Config{
		BackendURL:   getEnv("BACKEND_URL", "http://localhost:8080"),
		WorkerToken:  getEnv("WORKER_TOKEN", ""),
		WorkerID:     getEnv("WORKER_ID", "worker-1"),
		PollInterval: interval,
	}
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
