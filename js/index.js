import BoardItem from '../component/board/boardItem.js';
import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import { authCheck, getServerUrl, prependChild, resolveImageUrl } from '../utils/function.js';
import { getPosts, searchPosts } from '../api/indexRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const SCROLL_THRESHOLD = 0.9;
const ITEMS_PER_LOAD = 10;
let currentPage = 1;
let hasNext = true;
const DEFAULT_SORT = 'recent';
let currentKeyword = '';
let currentSort = DEFAULT_SORT;
let isProcessing = false;

const updateSortVisibility = () => {
    const sortRow = document.querySelector('#searchSortRow');
    if (!sortRow) return;
    const isSearching = currentKeyword.trim().length > 0;
    sortRow.classList.toggle('isHidden', !isSearching);
    sortRow.setAttribute('aria-hidden', String(!isSearching));
};

// getBoardItem 함수
const getBoardItem = async (page = 1, pageSize = 10) => {
    const result =
        currentKeyword.trim() === ''
            ? await getPosts(page, pageSize)
            : await searchPosts(
                  currentKeyword,
                  page,
                  pageSize,
                  currentSort,
              );
    if (!result.ok) {
        throw new Error('Failed to load post list.');
    }
    return result.data;
};

const setBoardItem = boardData => {
    const boardList = document.querySelector('.boardList');
    if (boardList && boardData) {
        const itemsHtml = boardData
            .map(data =>
                BoardItem(
                    data.id,
                    data.createdAt,
                    data.title,
                    data.stats.viewCount ?? 0,
                    null,
                    data.nickname ,
                    null,
                    data.stats.likeCount,
                ),
            )
            .join('');
        boardList.innerHTML += ` ${itemsHtml}`;
    }
};

const resetBoardList = () => {
    const boardList = document.querySelector('.boardList');
    if (boardList) {
        boardList.innerHTML = '';
    }
};

const loadBoardItems = async ({ reset = false } = {}) => {
    if (isProcessing || (!reset && !hasNext)) return;
    isProcessing = true;

    try {
        if (reset) {
            currentPage = 1;
            hasNext = true;
            resetBoardList();
        }
        const result = await getBoardItem(currentPage, ITEMS_PER_LOAD);
        if (!result.posts || result.posts.length === 0) { hasNext = false; return; }
        setBoardItem(result.posts);
        hasNext = result.hasNext;
        currentPage += 1;
    } catch (error) {
        console.error('Error fetching items:', error);
        hasNext = false;
    } finally {
        isProcessing = false;
    }
};

const addSearchEvent = () => {
    const searchInput = document.querySelector('#searchInput');
    const searchButton = document.querySelector('.searchButton');
    if (!searchInput || !searchButton) return;

    const runSearch = async () => {
        const trimmedKeyword = searchInput.value.trim();
        if (trimmedKeyword.length > 0 && trimmedKeyword.length < 2) {
            Dialog('검색 실패', '검색어는 2글자 이상 입력해주세요.');
            return;
        }
        currentKeyword = trimmedKeyword;
        updateSortVisibility();
        await loadBoardItems({ reset: true });
    };

    searchButton.addEventListener('click', runSearch);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            runSearch();
        }
    });
};

const addSortEvent = () => {
    const sortSelect = document.querySelector('#searchSortSelect');
    if (!sortSelect) return;
    sortSelect.value = currentSort;

    sortSelect.addEventListener('change', async () => {
        currentSort = sortSelect.value || DEFAULT_SORT;
        if (currentKeyword.trim().length === 0) return;
        await loadBoardItems({ reset: true });
    });
};

// 스크롤 이벤트 추가
const addInfinityScrollEvent = () => {
    window.addEventListener('scroll', async () => {
        const hasScrolledToThreshold =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight * SCROLL_THRESHOLD;
        if (hasScrolledToThreshold) {
            await loadBoardItems();
        }
    });
};

const init = async () => {
    try {
        const token = authCheck();
        if (!token) return;

        const response = await fetch(`${getServerUrl()}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
        });

        if (!response.ok) { // ✅ HTTP_NOT_AUTHORIZED 대신
            window.location.href = '/html/login.html';
            return;
        }

        const { data } = await response.json();

        const profileImageUrl = resolveImageUrl(
            data.profileImageUrl,
            DEFAULT_PROFILE_IMAGE,
        );

        prependChild(
            document.body,
            Header('Community', 0, profileImageUrl),
        );

        updateSortVisibility();
        await loadBoardItems({ reset: true });

        addSearchEvent();
        addSortEvent();
        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
