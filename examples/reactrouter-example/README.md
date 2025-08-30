# React Router v7 + Uppy Upload Examples

**Complete showcase** of Uppy Dashboard with TUS (resumable), XHR (standard), and Transloadit (with processing) uploads in React Router v7 framework mode.

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore three upload methods:
- **TUS uploads**: Resumable, perfect for large files
- **XHR uploads**: Standard HTTP, ideal for regular files
- **Transloadit uploads**: With powerful file processing capabilities

## What You'll Learn

This example demonstrates **three upload approaches** with Uppy in React Router v7:

1. **TUS server setup** with Express middleware for resumable uploads
2. **XHR uploads** using React Router's native resource routes
3. **Transloadit uploads** with signature generation and file processing




## Transloadit Setup

To use Transloadit uploads, you need to:

1. **Sign up** at [transloadit.com](https://transloadit.com)
2. **Get your credentials** from your account dashboard
3. **Create a template** for your processing needs
4. **Set environment variables**:

```bash
export TRANSLOADIT_KEY="your_key_here"
export TRANSLOADIT_SECRET="your_secret_here"
export TRANSLOADIT_TEMPLATE_ID="your_template_id_here"
```

Or create a `.env` file:
```env
TRANSLOADIT_KEY=your_key_here
TRANSLOADIT_SECRET=your_secret_here
TRANSLOADIT_TEMPLATE_ID=your_template_id_here
```

