package video

import (
	"context"
	"net/http"

	"golang.org/x/oauth2"
)

func OAuthClientFromToken(accessToken string) *http.Client {
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{
			AccessToken: accessToken,
		},
	)

	return oauth2.NewClient(context.Background(), ts)
}
