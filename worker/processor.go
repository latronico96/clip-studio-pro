package main

import (
	"fmt"
)

func ProcessJob(job *Job, client *BackendClient) (map[string]any, error) {
    switch job.Type {
    case "VIDEO_CLIP":
        return ProcessVideoClip(job, client)
    default:
        return nil, fmt.Errorf("unknown job type: %s", job.Type)
    }
}