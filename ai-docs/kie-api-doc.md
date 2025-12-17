# Kie.ai API Documentation

> Comprehensive API documentation for Kie.ai - your gateway to affordable and stable AI APIs

# Welcome to Kie.ai API Documentation

This documentation provides comprehensive guides and references for integrating with [Kie.ai](https://kie.ai/), a platform offering affordable and stable AI APIs for seamless integration into your projects.

## About Kie.ai

Kie.ai delivers advanced AI capabilities through easy-to-integrate APIs, including text generation, music creation, video generation, and image processing. Our platform is designed for developers and businesses who need:

* **99.9% Uptime** - Reliable and stable API performance
* **Affordable Pricing** - Flexible point-based pricing system
* **High Concurrency** - Scalable solutions that grow with your needs
* **24/7 Support** - Professional technical assistance
* **Secure Integration** - Enterprise-grade data security

## Quick Start Guides

Get started quickly with our comprehensive API quickstart guides:

### 🎬 Video Generation APIs

<Card title="Veo3.1 API" icon="film" href="/veo3-api/quickstart">
  Generate professional-quality videos using Google's Veo3.1 API with advanced video creation capabilities.
</Card>

<Card title="Runway Aleph API" icon="wand-magic-sparkles" href="/runway-api/generate-aleph-video">
  Transform existing videos with AI-powered style transfer using Runway's advanced Aleph model for video-to-video generation.
</Card>

<Card title="Runway API" icon="video" href="/runway-api/quickstart">
  Create stunning videos with Runway Gen-3 Alpha Turbo API. Transform images into high-quality videos with advanced AI video generation.
</Card>

### 🎵 Audio & Music APIs

<Card title="Suno API" icon="music" href="/suno-api/quickstart">
  Generate high-quality music from text prompts using Suno V4 API. Create, extend, and manipulate audio content with advanced AI capabilities.
</Card>

### 🖼️ Image Generation APIs

<Card title="4O Image API" icon="image" href="/4o-image-api/quickstart">
  Advanced image generation and editing capabilities powered by GPT-4O vision model.
</Card>

<Card title="Flux Kontext API" icon="palette" href="/flux-kontext-api/quickstart">
  Create and edit images with context-aware AI using the powerful Flux Kontext model.
</Card>

### 🔧 Utility APIs

<Card title="File Upload API" icon="upload" href="/file-upload-api/quickstart">
  Securely upload and manage files with support for multiple formats and storage options.
</Card>

<Card title="Common API" icon="gear" href="/common-api/quickstart">
  Essential utilities including account management, credit tracking, and system information.
</Card>

## Documentation Features

* **Interactive Examples** - Test APIs directly in our documentation
* **Code Samples** - Ready-to-use examples in multiple programming languages
* **Comprehensive Guides** - Step-by-step integration instructions
* **API Reference** - Complete parameter documentation and response schemas
* **Best Practices** - Optimization tips and common use cases

## Getting Started

1. **Sign Up** - Create your free account at [Kie.ai](https://kie.ai/)
2. **Get API Key** - Obtain your authentication credentials
3. **Choose Your API** - Select from our comprehensive API collection
4. **Follow Quickstart** - Use our guides to integrate quickly
5. **Test & Deploy** - Validate your integration and go live

## Support & Community

* **24/7 Support** - Contact our technical team anytime
* **Email Support** - [support@kie.ai](mailto:support@kie.ai)
* **Documentation Updates** - Regular improvements and new features
* **API Playground** - Test APIs before integration

***

Ready to get started? Choose an API above and follow the quickstart guide to begin integrating powerful AI capabilities into your project.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.kie.ai/llms.txt

# Nano Banana Pro API Documentation

> Generate content using the Nano Banana Pro model

## Overview

This document describes how to use the Nano Banana Pro model for content generation. The process consists of two steps:
1. Create a generation task
2. Query task status and results

## Authentication

All API requests require a Bearer Token in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

Get API Key:
1. Visit [API Key Management Page](https://kie.ai/api-key) to get your API Key
2. Add to request header: `Authorization: Bearer YOUR_API_KEY`

---

## 1. Create Generation Task

### API Information
- **URL**: `POST https://api.kie.ai/api/v1/jobs/createTask`
- **Content-Type**: `application/json`

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | Model name, format: `nano-banana-pro` |
| input | object | Yes | Input parameters object |
| callBackUrl | string | No | Callback URL for task completion notifications. If provided, the system will send POST requests to this URL when the task completes (success or fail). If not provided, no callback notifications will be sent. Example: `"https://your-domain.com/api/callback"` |

### Model Parameter

The `model` parameter specifies which AI model to use for content generation.

| Property | Value | Description |
|----------|-------|-------------|
| **Format** | `nano-banana-pro` | The exact model identifier for this API |
| **Type** | string | Must be passed as a string value |
| **Required** | Yes | This parameter is mandatory for all requests |

> **Note**: The model parameter must match exactly as shown above. Different models have different capabilities and parameter requirements.

### Callback URL Parameter

The `callBackUrl` parameter allows you to receive automatic notifications when your task completes.

| Property | Value | Description |
|----------|-------|-------------|
| **Purpose** | Task completion notification | Receive real-time updates when your task finishes |
| **Method** | POST request | The system sends POST requests to your callback URL |
| **Timing** | When task completes | Notifications sent for both success and failure states |
| **Content** | Query Task API response | Callback content structure is identical to the Query Task API response |
| **Parameters** | Complete request data | The `param` field contains the complete Create Task request parameters, not just the input section |
| **Optional** | Yes | If not provided, no callback notifications will be sent |

**Important Notes:**
- The callback content structure is identical to the Query Task API response
- The `param` field contains the complete Create Task request parameters, not just the input section  
- If `callBackUrl` is not provided, no callback notifications will be sent

### input Object Parameters

#### prompt
- **Type**: `string`
- **Required**: Yes
- **Description**: A text description of the image you want to generate
- **Max Length**: 10000 characters
- **Default Value**: `"Comic poster: cool banana hero in shades leaps from sci-fi pad. Six panels: 1) 4K mountain landscape, 2) banana holds page of long multilingual text with auto translation, 3) Gemini 3 hologram for search/knowledge/reasoning, 4) camera UI sliders for angle focus color, 5) frame trio 1:1-9:16, 6) consistent banana poses. Footer shows Google icons. Tagline: Nano Banana Pro now on Kie AI."`

#### image_input
- **Type**: `array`
- **Required**: No
- **Description**: Input images to transform or use as reference (supports up to 8 images)
- **Max File Size**: 30MB
- **Accepted File Types**: image/jpeg, image/png, image/webp
- **Multiple Files**: Yes
- **Default Value**: `[]`

#### aspect_ratio
- **Type**: `string`
- **Required**: No
- **Description**: Aspect ratio of the generated image
- **Options**:
  - `1:1`: 1:1
  - `2:3`: 2:3
  - `3:2`: 3:2
  - `3:4`: 3:4
  - `4:3`: 4:3
  - `4:5`: 4:5
  - `5:4`: 5:4
  - `9:16`: 9:16
  - `16:9`: 16:9
  - `21:9`: 21:9
  - `auto`: Auto
- **Default Value**: `"1:1"`

#### resolution
- **Type**: `string`
- **Required**: No
- **Description**: Resolution of the generated image
- **Options**:
  - `1K`: 1K
  - `2K`: 2K
  - `4K`: 4K
- **Default Value**: `"1K"`

#### output_format
- **Type**: `string`
- **Required**: No
- **Description**: Format of the output image
- **Options**:
  - `png`: PNG
  - `jpg`: JPG
- **Default Value**: `"png"`

### Request Example

```json
{
  "model": "nano-banana-pro",
  "input": {
    "prompt": "Comic poster: cool banana hero in shades leaps from sci-fi pad. Six panels: 1) 4K mountain landscape, 2) banana holds page of long multilingual text with auto translation, 3) Gemini 3 hologram for search/knowledge/reasoning, 4) camera UI sliders for angle focus color, 5) frame trio 1:1-9:16, 6) consistent banana poses. Footer shows Google icons. Tagline: Nano Banana Pro now on Kie AI.",
    "image_input": [],
    "aspect_ratio": "1:1",
    "resolution": "1K",
    "output_format": "png"
  }
}
```
### Response Example

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "281e5b0*********************f39b9"
  }
}
```

### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | integer | Response status code, 200 indicates success |
| msg | string | Response message |
| data.taskId | string | Task ID for querying task status |

---

## 2. Query Task Status

### API Information
- **URL**: `GET https://api.kie.ai/api/v1/jobs/recordInfo`
- **Parameter**: `taskId` (passed via URL parameter)

### Request Example
```
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=281e5b0*********************f39b9
```

### Response Example

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "281e5b0*********************f39b9",
    "model": "nano-banana-pro",
    "state": "waiting",
    "param": "{\"model\":\"nano-banana-pro\",\"input\":{\"prompt\":\"Comic poster: cool banana hero in shades leaps from sci-fi pad. Six panels: 1) 4K mountain landscape, 2) banana holds page of long multilingual text with auto translation, 3) Gemini 3 hologram for search/knowledge/reasoning, 4) camera UI sliders for angle focus color, 5) frame trio 1:1-9:16, 6) consistent banana poses. Footer shows Google icons. Tagline: Nano Banana Pro now on Kie AI.\",\"image_input\":[],\"aspect_ratio\":\"1:1\",\"resolution\":\"1K\",\"output_format\":\"png\"}}",
    "resultJson": "{\"resultUrls\":[\"https://static.aiquickdraw.com/tools/example/1763662100739_DlBXJvdR.png\"]}",
    "failCode": null,
    "failMsg": null,
    "costTime": null,
    "completeTime": null,
    "createTime": 1757584164490
  }
}
```

### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | integer | Response status code, 200 indicates success |
| msg | string | Response message |
| data.taskId | string | Task ID |
| data.model | string | Model name used |
| data.state | string | Task status: `waiting`(waiting),  `success`(success), `fail`(fail) |
| data.param | string | Task parameters (JSON string) |
| data.resultJson | string | Task result (JSON string, available when task is success). Structure depends on outputMediaType: `{resultUrls: []}` for image/media/video, `{resultObject: {}}` for text |
| data.failCode | string | Failure code (available when task fails) |
| data.failMsg | string | Failure message (available when task fails) |
| data.costTime | integer | Task duration in milliseconds (available when task is success) |
| data.completeTime | integer | Completion timestamp (available when task is success) |
| data.createTime | integer | Creation timestamp |

---

## Usage Flow

1. **Create Task**: Call `POST https://api.kie.ai/api/v1/jobs/createTask` to create a generation task
2. **Get Task ID**: Extract `taskId` from the response
3. **Wait for Results**: 
   - If you provided a `callBackUrl`, wait for the callback notification
   - If no `callBackUrl`, poll status by calling `GET https://api.kie.ai/api/v1/jobs/recordInfo`
4. **Get Results**: When `state` is `success`, extract generation results from `resultJson`

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Request successful |
| 400 | Invalid request parameters |
| 401 | Authentication failed, please check API Key |
| 402 | Insufficient account balance |
| 404 | Resource not found |
| 422 | Parameter validation failed |
| 429 | Request rate limit exceeded |
| 500 | Internal server error |

