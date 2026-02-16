package main

import (
	"bytes"
	"clipstudio-worker/types"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type ClaimResponse struct {
	Job *types.Job `json:"job"`
}

type BackendClient struct {
	baseURL  string
	token    string
	workerID string
	client   *http.Client
}

func NewBackendClient(cfg Config) *BackendClient {
	log.Println("[WORKER] Creating BackendClient with URL:", cfg.BackendURL)
	log.Println("[WORKER] token:", cfg.WorkerToken)
	return &BackendClient{
		baseURL:  cfg.BackendURL,
		token:    cfg.WorkerToken,
		workerID: cfg.WorkerID,
		client:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *BackendClient) auth(req *http.Request) {
	log.Println("[WORKER] Authenticating request with token:", c.token)
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-worker-id", c.workerID)
}

func (c *BackendClient) FetchNextJob() (*types.Job, error) {
	log.Println("[WORKER] FetchNextJob → POST /api/internal/jobs/claim")

	req, err := http.NewRequest(
		"POST",
		c.baseURL+"/api/internal/jobs/claim",
		nil,
	)
	if err != nil {
		return nil, err
	}

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		log.Println("[WORKER] Request error:", err)
		return nil, err
	}
	defer res.Body.Close()

	log.Printf(
		"[WORKER] FetchNextJob ← status=%d %s",
		res.StatusCode,
		res.Status,
	)

	bodyBytes, err := io.ReadAll(res.Body)
	if err != nil {
		log.Println("[WORKER] Read body error:", err)
		return nil, err
	}

	log.Println("[WORKER] Raw response body:", string(bodyBytes))

	res.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var resp ClaimResponse
	if err := json.NewDecoder(res.Body).Decode(&resp); err != nil {
		log.Println("[WORKER] Decode error:", err)
		return nil, err
	}

	if resp.Job == nil {
		log.Println("[WORKER] No job available")
		return nil, nil
	}

	log.Printf("[WORKER] Job claimed → id=%s", resp.Job.ID)

	return resp.Job, nil
}

func (c *BackendClient) UpdateJobStatus(jobID string, status string) error {
	body, _ := json.Marshal(map[string]string{
		"status": status,
	})

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/status", c.baseURL, jobID),
		bytes.NewBuffer(body),
	)
	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	return nil
}

func (c *BackendClient) CompleteJob(jobID string, result any, workerID string) error {
	if jobID == "" {
		return fmt.Errorf("jobID is empty")
	}

	log.Println("[WORKER] Completing job:", jobID)

	body, _ := json.Marshal(map[string]any{
		"status": "COMPLETED",
		"result": result,
	})

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/complete", c.baseURL, jobID),
		bytes.NewBuffer(body),
	)

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("complete failed: %s - %s", res.Status, string(b))
	}

	return nil
}

func (c *BackendClient) FailJob(jobID string, err error) error {
	body, _ := json.Marshal(map[string]any{
		"status": "FAILED",
		"error":  err.Error(),
	})

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/complete", c.baseURL, jobID),
		bytes.NewBuffer(body),
	)

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		return fmt.Errorf("fail failed: %s", res.Status)
	}

	return nil
}

func (c *BackendClient) Heartbeat(jobID string, workerID string) error {

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/heartbeat", c.baseURL, jobID),
		nil,
	)

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		return fmt.Errorf("heartbeat failed: %s", res.Status)
	}

	return nil
}

func (c *BackendClient) UpdateProgress(jobID string, progress int) error {
	body, _ := json.Marshal(map[string]any{
		"progress": progress,
	})

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/progress", c.baseURL, jobID),
		bytes.NewBuffer(body),
	)

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		return fmt.Errorf("progress failed: %s", res.Status)
	}

	return nil
}
