package main

import (
	"clipstudio-worker/video"
	"log"
)

func ProcessVideoClip(job *Job, client *BackendClient) (map[string]any, error) {
	log.Println("[VIDEO] job start", job.ID)

	client.UpdateProgress(job.ID, 5)

	input, err := video.DownloadYoutube(job.Payload.YoutubeVideoID, job.Payload.YoutubeAccessToken)
	if err != nil {
		return nil, err
	}

	client.UpdateProgress(job.ID, 30)

	output, err := video.CutVideo(input, job.Payload.Start, job.Payload.End)
	if err != nil {
		return nil, err
	}

	client.UpdateProgress(job.ID, 80)

	oauthClient := video.OAuthClientFromToken(job.Payload.YoutubeAccessToken)
	ytService, err := video.NewYouTubeService(oauthClient)
	if err != nil {
		return nil, err
	}
	
	url, err := video.UploadResult(output, ytService)
	if err != nil {
		return nil, err
	}

	client.UpdateProgress(job.ID, 100)

	return map[string]any{
		"url": url,
	}, nil
}
