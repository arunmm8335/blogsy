import cacheService from '../services/cacheService.js';
import { getDbProvider } from '../config/db.js';
import { getSupabaseClient } from '../config/supabase.js';

const commentSelectWithAuthor = `
  id,
  content,
  author_id,
  post_id,
  parent_id,
  created_at,
  updated_at,
  users!comments_author_id_fkey(id, username, profile_picture)
`;

const mapCommentRowToLegacy = (row, reactionsByCommentId = new Map()) => {
  const reactions = reactionsByCommentId.get(row.id) || { likes: [], dislikes: [] };

  return {
    _id: row.id,
    content: row.content,
    authorId: row.users
      ? {
        _id: row.users.id,
        username: row.users.username,
        profilePicture: row.users.profile_picture || '',
      }
      : row.author_id,
    postId: row.post_id,
    parentId: row.parent_id,
    likes: reactions.likes,
    dislikes: reactions.dislikes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const buildReactionsMap = (reactionRows) => {
  const reactionsByCommentId = new Map();

  reactionRows.forEach((row) => {
    if (!reactionsByCommentId.has(row.comment_id)) {
      reactionsByCommentId.set(row.comment_id, { likes: [], dislikes: [] });
    }

    const entry = reactionsByCommentId.get(row.comment_id);
    if (row.reaction === 'like') {
      entry.likes.push(row.user_id);
    } else if (row.reaction === 'dislike') {
      entry.dislikes.push(row.user_id);
    }
  });

  return reactionsByCommentId;
};

const fetchReactionsMapForComments = async (supabase, commentIds) => {
  if (!commentIds.length) {
    return new Map();
  }

  const { data: reactionRows, error } = await supabase
    .from('comment_reactions')
    .select('comment_id,user_id,reaction')
    .in('comment_id', commentIds);

  if (error) {
    throw error;
  }

  return buildReactionsMap(reactionRows);
};

// @desc    Add a comment to a post
// @route   POST /api/comments
// @access  Private
export const addComment = async (req, res) => {
  const { postId, content, parentId } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment content cannot be empty.' });
  }

  try {
    if (getDbProvider() !== 'supabase') {
      return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
    }

    const supabase = getSupabaseClient();

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      throw postError;
    }

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { data: row, error: insertError } = await supabase
      .from('comments')
      .insert({
        content,
        post_id: postId,
        parent_id: parentId || null,
        author_id: req.user._id,
      })
      .select(commentSelectWithAuthor)
      .single();

    if (insertError) {
      throw insertError;
    }

    await cacheService.del(`comments:post:${postId}`);
    console.log('Cache cleared for new comment');
    return res.status(201).json(mapCommentRowToLegacy(row));

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all comments for a post
// @route   GET /api/comments/:postId
// @access  Public
export const getCommentsForPost = async (req, res) => {
  const { postId } = req.params;
  const cacheKey = `comments:post:${postId}`;

  try {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return res.json(cached);
    }

    console.log('Cache miss:', cacheKey);

    if (getDbProvider() !== 'supabase') {
      return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
    }

    const supabase = getSupabaseClient();

    const { data: rows, error } = await supabase
      .from('comments')
      .select(commentSelectWithAuthor)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const reactionsByCommentId = await fetchReactionsMapForComments(
      supabase,
      rows.map((row) => row.id)
    );

    const comments = rows.map((row) => mapCommentRowToLegacy(row, reactionsByCommentId));
    await cacheService.set(cacheKey, comments, 300);
    return res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a comment (and its replies)
// @route   DELETE /api/comments/:id
// @access  Private (Author only)
export const deleteComment = async (req, res) => {
  try {
    if (getDbProvider() !== 'supabase') {
      return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
    }

    const supabase = getSupabaseClient();

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, post_id, author_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (commentError) {
      throw commentError;
    }

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (String(comment.author_id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      throw deleteError;
    }

    await cacheService.del(`comments:post:${comment.post_id}`);
    console.log('Cache cleared for comment deletion');

    return res.json({ message: 'Comment and all replies removed' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Like or unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
export const toggleLikeComment = async (req, res) => {
  try {
    if (getDbProvider() !== 'supabase') {
      return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
    }

    const supabase = getSupabaseClient();
    const commentId = req.params.id;
    const userId = req.user._id;

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, post_id')
      .eq('id', commentId)
      .maybeSingle();

    if (commentError) {
      throw commentError;
    }

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const { data: existing, error: existingError } = await supabase
      .from('comment_reactions')
      .select('reaction')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const hasLiked = existing?.reaction === 'like';

    if (hasLiked) {
      const { error: deleteError } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      const { error: upsertError } = await supabase
        .from('comment_reactions')
        .upsert({ comment_id: commentId, user_id: userId, reaction: 'like' }, { onConflict: 'comment_id,user_id' });

      if (upsertError) {
        throw upsertError;
      }
    }

    const { count: likes, error: likesError } = await supabase
      .from('comment_reactions')
      .select('comment_id', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('reaction', 'like');

    if (likesError) {
      throw likesError;
    }

    const { count: dislikes, error: dislikesError } = await supabase
      .from('comment_reactions')
      .select('comment_id', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('reaction', 'dislike');

    if (dislikesError) {
      throw dislikesError;
    }

    await cacheService.del(`comments:post:${comment.post_id}`);
    return res.json({ likes: likes || 0, dislikes: dislikes || 0, liked: !hasLiked });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Dislike or undislike a comment
// @route   POST /api/comments/:id/dislike
// @access  Private
export const toggleDislikeComment = async (req, res) => {
  try {
    if (getDbProvider() !== 'supabase') {
      return res.status(500).json({ message: 'Backend DB_PROVIDER must be set to supabase' });
    }

    const supabase = getSupabaseClient();
    const commentId = req.params.id;
    const userId = req.user._id;

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, post_id')
      .eq('id', commentId)
      .maybeSingle();

    if (commentError) {
      throw commentError;
    }

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const { data: existing, error: existingError } = await supabase
      .from('comment_reactions')
      .select('reaction')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const hasDisliked = existing?.reaction === 'dislike';

    if (hasDisliked) {
      const { error: deleteError } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      const { error: upsertError } = await supabase
        .from('comment_reactions')
        .upsert({ comment_id: commentId, user_id: userId, reaction: 'dislike' }, { onConflict: 'comment_id,user_id' });

      if (upsertError) {
        throw upsertError;
      }
    }

    const { count: likes, error: likesError } = await supabase
      .from('comment_reactions')
      .select('comment_id', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('reaction', 'like');

    if (likesError) {
      throw likesError;
    }

    const { count: dislikes, error: dislikesError } = await supabase
      .from('comment_reactions')
      .select('comment_id', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('reaction', 'dislike');

    if (dislikesError) {
      throw dislikesError;
    }

    await cacheService.del(`comments:post:${comment.post_id}`);
    return res.json({ likes: likes || 0, dislikes: dislikes || 0, disliked: !hasDisliked });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};