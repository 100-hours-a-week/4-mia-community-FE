import CommentItem from '../component/comment/comment.js';
import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import {
    authCheck,
    getServerUrl,
    prependChild,
    padTo2Digits,
    resolveImageUrl,
} from '../utils/function.js';
import {
    getPost,
    deletePost,
    writeComment,
    getComments,
    likePost,
    unlikePost,
} from '../api/boardRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const MAX_COMMENT_LENGTH = 1000;
const HTTP_NOT_AUTHORIZED = 401;
const HTTP_OK = 200;
const COMMENTS_PER_LOAD = 10;

let commentCursor = null;
let commentHasNext = true;
let isCommentLoading = false;

const formatCount = value => {
    const count = Number(value);
    if (!Number.isFinite(count)) return value ?? '';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
};

const setLikeButtonState = (button, isLiked) => {
    button.classList.toggle('is-active', isLiked);
    button.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
};

const getQueryString = name => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

const getBoardDetail = async postId => {
    const { ok, data } = await getPost(postId);
    if (!ok)
        return new Error('게시글 정보를 가져오는데 실패하였습니다.');
    return data;
};

const setBoardDetail = data => {
    // 헤드 정보
    const titleElement = document.querySelector('.title');
    const createdAtElement = document.querySelector('.createdAt');
    const imgElement = document.querySelector('.img');
    const nicknameElement = document.querySelector('.nickname');

    titleElement.textContent = data.title;
    const postId = data.id;
    const date = new Date(data.createdAt);
    const formattedDate = `${date.getFullYear()}-${padTo2Digits(date.getMonth() + 1)}-${padTo2Digits(date.getDate())} ${padTo2Digits(date.getHours())}:${padTo2Digits(date.getMinutes())}:${padTo2Digits(date.getSeconds())}`;
    createdAtElement.textContent = formattedDate;

    imgElement.src = resolveImageUrl(
        data.profileImageUrl,
        DEFAULT_PROFILE_IMAGE,
    );

    nicknameElement.textContent = data.nickname;

    // 바디 정보
    const contentImgElement = document.querySelector('.contentImg');
    const fileUrl = data.fileUrl || resolveImageUrl(data.filePath);
    if (fileUrl) {
        console.log(fileUrl);
        const img = document.createElement('img');
        img.src = fileUrl;
        contentImgElement.appendChild(img);
    }
    const contentElement = document.querySelector('.content');
    contentElement.textContent = data.content;

    const likeButtonElement = document.querySelector('.likeButton');
    const likeCountElement = likeButtonElement.querySelector('h3');
    let isLiked = Boolean(data.isLiked);
    let isLikeLoading = false;

    likeCountElement.textContent = formatCount(data.stats.likeCount);
    setLikeButtonState(likeButtonElement, isLiked);

    likeButtonElement.addEventListener('click', async () => {
        if (isLikeLoading) return;
        isLikeLoading = true;

        try {
            if (!isLiked) {
                const { ok, status, code, data: likeData } = await likePost(postId);
                if (ok) {
                    isLiked = true;
                    setLikeButtonState(likeButtonElement, isLiked);
                    if (likeData && likeData.likeCount !== undefined) {
                        likeCountElement.textContent = formatCount(
                            likeData.likeCount,
                        );
                    }
                } else if (status === 409 && code === 'ALREADY_LIKED_POST') {
                    isLiked = true;
                    setLikeButtonState(likeButtonElement, isLiked);
                } else if (status === HTTP_NOT_AUTHORIZED) {
                    window.location.href = '/html/login.html';
                } else {
                    Dialog('좋아요 실패', '좋아요 처리에 실패하였습니다.');
                }
            } else {
                const { ok, status, data: likeData } = await unlikePost(postId);
                if (ok) {
                    isLiked = false;
                    setLikeButtonState(likeButtonElement, isLiked);
                    if (likeData && likeData.likeCount !== undefined) {
                        likeCountElement.textContent = formatCount(
                            likeData.likeCount,
                        );
                    }
                } else if (status === HTTP_NOT_AUTHORIZED) {
                    window.location.href = '/html/login.html';
                } else {
                    Dialog('좋아요 취소 실패', '좋아요 취소에 실패하였습니다.');
                }
            }
        } finally {
            isLikeLoading = false;
        }
    });

    const viewCountElement = document.querySelector('.viewCount h3');
    viewCountElement.textContent = formatCount(data.stats.viewCount);

    const commentCountElement = document.querySelector('.commentCount h3');
    commentCountElement.textContent = (data.stats.commentCount ?? 0).toLocaleString();
};

const setBoardModify = async (data, myInfo) => {
    if (myInfo.userId === data.userId) {
        const modifyElement = document.querySelector('.hidden');
        modifyElement.classList.remove('hidden');

        const modifyBtnElement = document.querySelector('#deleteBtn');
        const postId = getQueryString('id');
        modifyBtnElement.addEventListener('click', () => {
            // 삭제 버튼 클릭 이벤트
            if (myInfo.userId !== data.userId) {
                return Dialog('권한 없음', '권한이 없습니다.');
            }

            Dialog(
                '게시글을 삭제하시겠습니까?',
                '삭제한 내용은 복구 할 수 없습니다.',
                async () => {
                    const { ok } = await deletePost(postId);
                    if (ok) {
                        window.location.href = '/';
                    } else {
                        Dialog('삭제 실패', '게시글 삭제에 실패하였습니다.');
                    }
                },
            );
        });

        const modifyBtnElement2 = document.querySelector('#modifyBtn');
        modifyBtnElement2.addEventListener('click', () => {
            window.location.href = `/html/board-modify.html?postId=${data.id}`;
        });
    }
};

const getBoardComment = async (id, cursor) => {
    const { ok, status, data } = await getComments(
        id,
        cursor,
        COMMENTS_PER_LOAD,
    );
    if (!ok || status !== HTTP_OK || !data) {
        return { comments: [], nextCursor: null, hasNext: false };
    }
    return {
        comments: data.comments ?? [],
        nextCursor: data.nextCursor ?? null,
        hasNext: Boolean(data.hasNext),
    };
};

let commentObserver = null;

const loadBoardComments = async (postId, myInfo) => {
    if (isCommentLoading || !commentHasNext) return;
    isCommentLoading = true;

    try {
        const { comments, nextCursor, hasNext } = await getBoardComment(
            postId,
            commentCursor,
        );
        setBoardComment(comments, myInfo);
        commentCursor = nextCursor;
        commentHasNext = hasNext && nextCursor !== null;
    } catch (error) {
        console.error(error);
        commentHasNext = false;
    } finally {
        isCommentLoading = false;
    }

    if (!commentHasNext && commentObserver) {
        commentObserver.disconnect();
        commentObserver = null;
    }
};

// 댓글 목록 하단 sentinel이 화면에 들어오면 다음 댓글을 불러옴
const addCommentInfiniteScroll = (postId, myInfo) => {
    const sentinel = document.querySelector('.commentSentinel');
    if (!sentinel) return;

    commentObserver = new IntersectionObserver(
        async entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            await loadBoardComments(postId, myInfo);
            // 불러온 뒤에도 sentinel이 계속 보이면(댓글이 짧은 경우) 이어서 로드
            if (commentObserver) {
                commentObserver.unobserve(sentinel);
                commentObserver.observe(sentinel);
            }
        },
        { rootMargin: '200px 0px' },
    );
    commentObserver.observe(sentinel);
};

const setBoardComment = (data, myInfo) => {
    const commentListElement = document.querySelector('.commentList');
    if (commentListElement) {
        data.forEach(event => {
            const item = CommentItem(
                event,
                myInfo.userId,
                event.postId,
                event.id,
            );
            commentListElement.appendChild(item);
        });
    }
};

const addComment = async () => {
    const comment = document.querySelector('textarea').value;
    const pageId = getQueryString('id');

    const { ok } = await writeComment(pageId, comment);

    if (ok) {
        window.location.reload();
    } else {
        Dialog('댓글 등록 실패', '댓글 등록에 실패하였습니다.');
    }
};

const inputComment = async () => {
    const textareaElement = document.querySelector(
        '.commentInputWrap textarea',
    );
    const commentBtnElement = document.querySelector('.commentInputBtn');

    if (textareaElement.value.length > MAX_COMMENT_LENGTH) {
        textareaElement.value = textareaElement.value.substring(
            0,
            MAX_COMMENT_LENGTH,
        );
    }
    if (textareaElement.value === '') {
        commentBtnElement.disabled = true;
        commentBtnElement.style.backgroundColor = '#ACA0EB';
    } else {
        commentBtnElement.disabled = false;
        commentBtnElement.style.backgroundColor = '#7F6AEE';
    }
};

const init = async () => {
    try {
        const token = authCheck();
        if (!token) return;

        const response = await fetch(`${getServerUrl()}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
        });

        if (!response.ok) {
            window.location.href = '/html/login.html';
            return;
        }

        const { data: myInfo } = await response.json();

        const profileImage = resolveImageUrl(
            myInfo.profileImageUrl,
            DEFAULT_PROFILE_IMAGE,
        );

        prependChild(document.body, Header('커뮤니티', 2, profileImage));

        const commentBtnElement = document.querySelector('.commentInputBtn');
        const textareaElement = document.querySelector('.commentInputWrap textarea');
        textareaElement.addEventListener('input', inputComment);
        commentBtnElement.addEventListener('click', addComment);
        commentBtnElement.disabled = true;

        const pageId = getQueryString('id');
        const pageData = await getBoardDetail(pageId);

        await setBoardModify(pageData, myInfo);
        setBoardDetail(pageData);

        addCommentInfiniteScroll(pageId, myInfo);
    } catch (error) {
        console.error(error);
    }
};

init();
