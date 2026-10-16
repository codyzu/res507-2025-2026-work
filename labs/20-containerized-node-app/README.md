# Lab 20 — Containerized Node Application

This directory contains the **work repository scaffold** for Lab 20 of the course.

You will build, run, and containerize a small Node.js application backed by a PostgreSQL database.
The focus of this lab is **containers, configuration, and runtime behavior**, not Node.js itself.

## How this repo is used

- You should be working from **your own fork** of this repository.
- The **step-by-step instructions** for this lab are provided on the course website.
- This repository contains only the files you will modify and run during the lab.

## Directory structure

- `app/`  
  The Node.js application (Fastify + Handlebars).

- `db/`  
  Database initialization scripts.

- `docker/`  
  Dockerfile and Docker Compose configuration.
  
## Failed step
- cause : syntax error in the Dockerfile
- change fixes : remove the syntax error

## Explain at least one failure that could still occur with green CI:
- any security flaw like a bad pwd or permition of the project

## Important notes

- Do not commit `node_modules`.
- Configuration is provided via environment variables.
- The application is designed to start even if the database is not running.
- Database access is enabled as part of the lab exercises.

## Where to start

Follow the Lab 20 instructions on the course website.
They will guide you through running the application using Docker, connecting it to PostgreSQL, and packaging it correctly.
