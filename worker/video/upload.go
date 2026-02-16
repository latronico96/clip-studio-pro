package video

import (
	"clipstudio-worker/types"
	"os"
	"google.golang.org/api/youtube/v3"
)

func UploadResult(job *types.Job, path string, yt *youtube.Service) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	video := &youtube.Video{
		Snippet: &youtube.VideoSnippet{
			Title:       job.Title,
			Description: job.Description,
			CategoryId:  job.CategoryID,
		},
		Status: &youtube.VideoStatus{
			PrivacyStatus: job.PrivacyStatus,
		},
	}

	resp, err := yt.Videos.Insert(
		[]string{"snippet", "status"},
		video,
	).Media(file).Do()

	if err != nil {
		return "", err
	}

	return "https://www.youtube.com/watch?v=" + resp.Id, nil
}
