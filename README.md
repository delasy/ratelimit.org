# ratelimit.org
Rate limiting service
> For any service-related questions contact me: aaron@thelang.io

## Register a limiter

```shell
curl https://ratelimit.org/register?requests_count=4&time_frame=1000
```

### Query Params
**requests_count** - maximum number of requests allowed for specified time
frame. The default is only one. \
**time_frame** - time frame in which requests can be executed.

### Response
As a response you will get a UUID string, which you will need for request
later.

## Make a request
```shell
curl https://ratelimit.org/{id}?url=https%3A%2F%2Fexample.com
```

> Replace `{id}` with response from register request.

### Query Params
**url** - URL you want to query with a limiter. \
**...rest** - all other query params except `url` will be forwarded when doing
request to provided URL.

### Response
As a response you will get whatever was the response from URL.
