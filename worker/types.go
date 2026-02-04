package main

type Job struct {
	ID      string     `json:"id"`
	Type    string     `json:"type"`
	Status  string     `json:"status"`
	Payload JobPayload `json:"payload"`
}

type JobPayload struct {
	YoutubeVideoID     string `json:"youtubeVideoId"`
	YoutubeAccessToken string `json:"youtubeAccessToken"`
	Start              int    `json:"start"`
	End                int    `json:"end"`
	Platform           string `json:"platform"`
}
