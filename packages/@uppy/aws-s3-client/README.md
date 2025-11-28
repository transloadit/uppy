# @uppy/aws-s3-client

 A Minimal aws-s3 client inspired by [good-lly/s3mini](https://github.com/good-lly/s3mini)

## Running Tests (Only minio is suported)

### prerequisites

- [Docker & Docker Compose](https://docs.docker.com/desktop/?_gl=1*ovvubi*_gcl_au*MTk2NzgwMzcxLjE3NjQzMjI3Njk.*_ga*MjE0MTk1Nzk3MC4xNzY0MjcwNDkz*_ga_XJWPQMJYHQ*czE3NjQzMjI3NjgkbzIkZzEkdDE3NjQzMjI3NzMkajU1JGwwJGgw)

### Setup

1. Copy `.env.example` to `.env` and add your values

```bash
cp .env.example .env
```
2. Start Minio

```bash
docker compose -f tests/compose.minio.yaml up -d
```
this would start minio API server on port `9002` and WEBUI console on port `9003`

3. Create the test bucket:
   - Go to `http://localhost:9003`
   - Login with your credentials from `.env`
   - Create a bucket matching `BUCKET_ENV_MINIO`

4. Run tests:
```bash
yarn test
```





