# Build the Docker image

docker build -t congress-api .

# Run the container

# -p 3000:8787 maps port 8787 from container to port 3000 on your host

docker run -p 8787:8787 congress-api

# To run in detached mode (background)

docker run -d -p 3000:8787 congress-api

# To see running containers

docker ps

# To see logs of a running container

docker logs <container_id>

# To stop a running container

docker stop <container_id>

# To remove a container

docker rm <container_id>

# To remove the image

docker rmi congress-api
