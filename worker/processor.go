package main

import (
	"context"
	"os/exec"
	"time"
)

func ProcessJob(job *Job) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
	defer cancel()

	cmd := exec.CommandContext(ctx, "echo", "PROCESSING job", job.ID)
	return cmd.Run()
}
