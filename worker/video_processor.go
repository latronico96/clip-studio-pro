package main

import (
	"clipstudio-worker/video"
	"log"
)

func ProcessVideoClip(job *Job, client *BackendClient) error {
	log.Println("[VIDEO] job start", job.ID)

	client.UpdateProgress(job.ID, 5)

	input, err := video.DownloadYoutube(job.Payload.YoutubeVideoID)
	if err != nil {
		return err
	}

	client.UpdateProgress(job.ID, 30)

	output, err := video.CutVideo(input, job.Payload.Start, job.Payload.End)
	if err != nil {
		return err
	}

	client.UpdateProgress(job.ID, 80)

	url, err := video.UploadResult(output, client.baseURL)
	if err != nil {
		return err
	}

	client.CompleteJob(job.ID, map[string]any{
		"url": url,
	}, "")

	return nil
}
