package video

import (
	"fmt"
	"os/exec"
	"path/filepath"
)

func DownloadYoutube(videoID string) (string, error) {
	output := filepath.Join("/tmp", videoID+".mp4")

	cmd := exec.Command(
		"yt-dlp",
		"-f", "mp4",
		"-o", output,
		"https://www.youtube.com/watch?v="+videoID,
	)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("yt-dlp failed: %w", err)
	}

	return output, nil
}
