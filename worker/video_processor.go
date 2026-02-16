package main

import (
	"clipstudio-worker/types"
	"clipstudio-worker/video"
	"errors"
	"fmt"
	"log"
	"os"
)

func ProcessVideoClip(job *types.Job, client *BackendClient) (map[string]any, error) {
	log.Println("[VIDEO] job start", job.ID)

	client.UpdateProgress(job.ID, 5)

	videoID := job.Payload.Source.YoutubeVideoID
	if videoID == "" {
		return nil, errors.New("videoID is required")
	}
	
	input, err := video.DownloadYoutube(videoID, job.Payload.Auth.Youtube.AccessToken)
	if err != nil {
		return nil, err
	}

	client.UpdateProgress(job.ID, 30)

	pwd, _ := os.Getwd()
	fmt.Println("CWD:", pwd)
	fmt.Println("cut parameters:", input, job.Payload.Start, job.Payload.End, job.Payload.LayoutMode)

	output, err := video.CutVideo(input, job.Payload.Start, job.Payload.End, job.Payload.LayoutMode)
	if err != nil {
		return nil, err
	}

	client.UpdateProgress(job.ID, 80)

	oauthClient := video.OAuthClientFromToken(job.Payload.Auth.Youtube.AccessToken)
	ytService, err := video.NewYouTubeService(oauthClient)
	if err != nil {
		return nil, err
	}

	url, err := video.UploadResult(job, output, ytService)
	if err != nil {
		return nil, err
	}

	client.UpdateProgress(job.ID, 100)

	return map[string]any{
		"url": url,
	}, nil
}
