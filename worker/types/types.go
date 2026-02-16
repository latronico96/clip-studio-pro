package types

type Job struct {
	ID            string     `json:"id"`
	Type          string     `json:"type"`
	Status        string     `json:"status"`
	Payload       JobPayload `json:"payload"`
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	CategoryID    string     `json:"categoryID"`
	PrivacyStatus string     `json:"privacystatus"`
}

type JobPayload struct {
	ClipID     string       `json:"clipId"`
	Start      float64      `json:"start"`
	End        float64      `json:"end"`
	LayoutMode string       `json:"layoutMode"`
	Platforms  []string     `json:"platforms"`
	Source     VideoSource  `json:"source"`
	Auth       AuthData     `json:"auth"`
}

type VideoSource struct {
	YoutubeVideoID string `json:"youtubeVideoId"`
}

type AuthData struct {
	Youtube *YoutubeAuth `json:"youtube,omitempty"`
	TikTok  *TikTokAuth  `json:"tiktok,omitempty"`
}

type YoutubeAuth struct {
	AccessToken string `json:"accessToken"`
}

type TikTokAuth struct {
	AccessToken string `json:"accessToken"`
}
