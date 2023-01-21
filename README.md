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
**time_frame** - todo.

### Response
As a response you will get a UUID string, which you will need for request
later.
