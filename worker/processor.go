package main

import (
	"fmt"
)

func ProcessJob(job *Job, client *BackendClient) error {
	switch job.Type {
	case "VIDEO_CLIP":
		return ProcessVideoClip(job, client)
	default:
		return fmt.Errorf("unknown job type: %s", job.Type)
	}
}