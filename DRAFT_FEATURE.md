# Post Drafts Feature

## Overview
The post drafts feature allows users to save their posts as drafts before publishing them. This provides a better writing experience by allowing users to work on posts over time without losing their progress.

## Features Implemented

### Backend Changes

#### 1. Database Schema Updates
- **Post Model** (`backend/models/Post.js`):
  - Added `status` field with enum values: `['draft', 'published']`
  - Default status is `'published'`
  - Added database index for faster filtering

#### 2. New API Endpoints
- **GET `/api/posts/drafts`** - Fetch user's drafts with pagination
- **PUT `/api/posts/:id/publish`** - Publish a draft post
- **Updated POST `/api/posts`** - Now accepts `status` parameter
- **Updated PUT `/api/posts/:id`** - Now accepts `status` parameter

#### 3. Controller Functions
- `getUserDrafts()` - Retrieves paginated drafts for authenticated user
- `publishDraft()` - Changes draft status to published
- Updated `createPost()` and `updatePost()` to handle status field
- Updated `getAllPosts()` to filter by status (defaults to published)

#### 4. Caching Integration
- Drafts are cached with 5-minute TTL
- Cache invalidation on draft operations
- Separate cache keys for drafts vs published posts

### Frontend Changes

#### 1. New Pages
- **DraftsPage** (`frontend/src/pages/DraftsPage.js`):
  - Displays user's drafts with pagination
  - Actions: Edit, Publish, Delete
  - Empty state with call-to-action
  - Responsive design with theme support

#### 2. Updated Pages
- **CreatePostPage**:
  - Added "Save as Draft" button
  - Status selection (published/draft)
  - Improved form layout with dual buttons

- **EditPostPage**:
  - Added status selector dropdown
  - Can change between draft and published status

#### 3. Navigation
- **Header** component updated with "Drafts" link
- Added route `/drafts` in App.js

#### 4. API Service
- `fetchUserDrafts()` - Fetch user drafts
- `publishDraft()` - Publish a draft
- Updated existing functions to handle status

## User Experience

### Creating Drafts
1. User goes to "Create Post" page
2. Can either:
   - Click "Publish Post" to publish immediately
   - Click "Save as Draft" to save as draft
3. Drafts can have minimal content (just title or just content)

### Managing Drafts
1. User clicks "Drafts" in header navigation
2. Views all their drafts with:
   - Title and content preview
   - Last updated timestamp
   - Tags (if any)
   - Action buttons: Edit, Publish, Delete

### Publishing Drafts
1. From drafts page: Click "Publish" button
2. From edit page: Change status to "Published" and save
3. Published drafts appear in public post lists

### Editing Drafts
1. Click "Edit" button from drafts page
2. Make changes in the editor
3. Can change status between draft/published
4. Save changes

## Technical Details

### Database Queries
- Drafts are filtered by `status: 'draft'` and `authorId`
- Published posts are filtered by `status: 'published'`
- Indexes ensure fast queries

### Security
- Only post authors can view/edit their drafts
- Authentication required for all draft operations
- Proper authorization checks in place

### Performance
- Redis caching for draft lists
- Pagination to handle large numbers of drafts
- Efficient database queries with proper indexing

## Future Enhancements

### Potential Improvements
1. **Auto-save**: Automatically save drafts as user types
2. **Draft sharing**: Allow sharing drafts with collaborators
3. **Draft scheduling**: Schedule drafts for future publication
4. **Draft templates**: Pre-defined templates for different post types
5. **Draft analytics**: Track draft completion rates and time spent

### Advanced Features
1. **Version history**: Track changes to drafts over time
2. **Draft comments**: Internal notes on drafts
3. **Draft categories**: Organize drafts by type or topic
4. **Bulk operations**: Publish or delete multiple drafts at once

## Testing

### Manual Testing Checklist
- [ ] Create a new draft
- [ ] Edit an existing draft
- [ ] Publish a draft
- [ ] Delete a draft
- [ ] View drafts page with pagination
- [ ] Change post status in edit page
- [ ] Verify drafts don't appear in public lists
- [ ] Verify published posts appear in public lists
- [ ] Test authorization (can't access others' drafts)
- [ ] Test cache invalidation

### API Testing
```bash
# Create a draft
POST /api/posts
{
  "title": "My Draft",
  "content": "Draft content",
  "status": "draft"
}

# Get user drafts
GET /api/posts/drafts

# Publish a draft
PUT /api/posts/:id/publish
```

## Deployment Notes

### Database Migration
- New `status` field is added with default value
- Existing posts will have `status: 'published'`
- No data migration required

### Environment Variables
- No new environment variables required
- Existing Redis configuration supports draft caching

### Backward Compatibility
- All existing functionality remains unchanged
- Published posts continue to work as before
- API endpoints maintain backward compatibility 