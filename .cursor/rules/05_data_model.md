# Modèle de données

Toujours penser indexation, unicité, pagination cursor-based.

## Users

- id
- email
- username
- displayName
- avatarUrl
- role
- status
- createdAt

## Channels

- id
- ownerUserId
- handle
- name
- description
- avatarUrl
- bannerUrl
- verified
- subscriberCount
- createdAt

## Videos

- id
- channelId
- title
- description
- visibility
- status
- durationSec
- categoryId
- language
- thumbnailUrl
- sourceAssetKey
- playbackAssetId
- hlsUrl
- viewsCount
- likesCount
- commentsCount
- publishedAt
- createdAt
- updatedAt

## VideoAssets

- id
- videoId
- assetType
- storageKey
- mimeType
- sizeBytes
- width
- height
- bitrate
- durationSec

## Tags

- id
- label

## VideoTags

- videoId
- tagId

## Subscriptions

- followerUserId
- channelId
- createdAt

## Comments

- id
- videoId
- userId
- parentCommentId
- body
- status
- likesCount
- createdAt

## Reactions

- userId
- targetType
- targetId
- reactionType

## Playlists

- id
- ownerUserId
- title
- description
- privacy
- createdAt

## PlaylistItems

- id
- playlistId
- videoId
- position
- createdAt

## WatchHistory

- id
- userId
- videoId
- progressSec
- completed
- watchedAt

## WatchLater

- userId
- videoId
- createdAt

## Notifications

- id
- userId
- type
- payload
- readAt
- createdAt

## Reports

- id
- reporterUserId
- targetType
- targetId
- reason
- details
- status
- createdAt

## ModerationActions

- id
- adminUserId
- targetType
- targetId
- actionType
- notes
- createdAt

## VideoAnalyticsDaily

- videoId
- date
- views
- uniqueViewers
- avgWatchTimeSec
- watchTimeHours
- ctr
