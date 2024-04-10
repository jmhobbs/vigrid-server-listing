test:
	go test -v ./...

build-linux: test
	GOOS=linux GOARCH=amd64 go build -o bin/poller-linux_amd64 .
