package video

import (
	"context"
	"net/http"

	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"
)

func NewYouTubeService(oauthClient *http.Client) (*youtube.Service, error) {
	return youtube.NewService(
		context.Background(),
		option.WithHTTPClient(oauthClient),
	)
}