package video

import (
	"os"
	"google.golang.org/api/youtube/v3"
)

func UploadResult(path string, yt *youtube.Service) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	video := &youtube.Video{
		Snippet: &youtube.VideoSnippet{
			Title:       "Clip generado automáticamente",
			Description: "#Shorts generado por ClipStudio",
			CategoryId:  "22",
		},
		Status: &youtube.VideoStatus{
			PrivacyStatus: "public",
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
