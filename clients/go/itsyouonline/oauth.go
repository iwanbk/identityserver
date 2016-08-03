package itsyouonline

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func (c *Itsyouonline) LoginWithClientCredentials(clientID, clientSecret string) (string, error) {
	// build request
	req, err := http.NewRequest("POST", rootURL+"/v1/oauth/access_token", nil)
	if err != nil {
		return "", err
	}

	// request query params
	qs := map[string]interface{}{
		"grant_type":    "client_credentials",
		"client_id":     clientID,
		"client_secret": clientSecret,
	}
	q := req.URL.Query()
	for k, v := range qs {
		q.Add(k, fmt.Sprintf("%v", v))
	}
	req.URL.RawQuery = q.Encode()

	// do the request
	rsp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	if rsp.StatusCode != 200 {
		return "", fmt.Errorf("invalid status code response:%v", rsp.StatusCode)
	}

	// decode
	var jsonResp map[string]interface{}
	if err := json.NewDecoder(rsp.Body).Decode(&jsonResp); err != nil {
		return "", err
	}
	val, ok := jsonResp["access_token"]
	if !ok {
		return "", fmt.Errorf("no token found")
	}

	token := fmt.Sprintf("%v", val)

	c.AuthHeader = "token " + token

	return token, nil

}
