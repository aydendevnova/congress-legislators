# README

## Overview

This project contains a custom `server.ts` API that interacts with the `congress-legislators` repository submodule. The `congress-legislators` submodule provides a structured dataset of information about members of the United States Congress.

## Features

- Custom API using `server.ts`.
- Seamless integration with the `congress-legislators` repository.

## Prerequisites

Ensure you have the following tools installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Git](https://git-scm.com/)

## Getting Started

### Clone the Repository with Submodules

To clone the repository along with its submodules, use the following command:

```bash
git clone --recursive YOUR_REPOSITORY_URL
```

If you already cloned the repository without the `--recursive` option, initialize the submodule with:

```bash
git submodule update --init
```

### Install Dependencies

Navigate to the root directory of your project and install the required dependencies:

```bash
npm install
```

### Run the API

To start the `server.ts` API, run:

```bash
npm start
```

This will launch the API on the default port. Visit `http://localhost:3000` (or the configured port) in your browser or API client.

## Submodule Usage

The `congress-legislators` submodule contains structured data in JSON format, which the API uses to serve requests. Ensure the submodule is updated to fetch the latest data:

```bash
git submodule update --remote
```

## Folder Structure

```
.
├── server.ts             # Custom API server
├── package.json          # Node.js project metadata
├── .gitmodules           # Submodule configuration
├── congress-legislators/ # Submodule directory
└── README.md             # Project documentation
```

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch-name`.
3. Make your changes and commit them: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature-branch-name`.
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [United States Congress-Legislators](https://github.com/unitedstates/congress-legislators) for the data.
