import BoardItem from '../component/board/boardItem.js';
import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import { authCheck, getServerUrl, prependChild, resolveImageUrl } from '../utils/function.js';
import { getPosts, searchPosts } from '../api/indexRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const PAGE_BLOCK_SIZE = 5;
let currentPage = 1;
let totalPages = 1;
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
const getBoardItem = async (page = 1) => {
    const result =
        currentKeyword.trim() === ''
            ? await getPosts(page)
            : await searchPosts(currentKeyword, page, currentSort);
    if (!result.ok) {
        throw new Error('Failed to load post list.');
    }
    return result.data;
};

const setBoardItem = boardData => {
    const boardList = document.querySelector('.boardList');
    if (!boardList) return;
    boardList.innerHTML = (boardData ?? [])
        .map(data =>
            BoardItem(
                data.id,
                data.createdAt,
                data.title,
                data.stats.viewCount ?? 0,
                data.profileImageUrl,
                data.nickname,
                data.stats.commentCount ?? 0,
                data.stats.likeCount,
            ),
        )
        .join('');
};

const createPageButton = (label, page, { active = false, disabled = false, ariaLabel } = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pageButton';
    button.textContent = label;
    button.dataset.page = String(page);
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
    if (active) {
        button.classList.add('isActive');
        button.setAttribute('aria-current', 'page');
    }
    button.disabled = disabled || active;
    return button;
};

// 5개 단위 블록: [<] 1 2 3 4 5 [>]
const renderPagination = () => {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    const blockStart =
        Math.floor((currentPage - 1) / PAGE_BLOCK_SIZE) * PAGE_BLOCK_SIZE + 1;
    const blockEnd = Math.min(blockStart + PAGE_BLOCK_SIZE - 1, totalPages);

    pagination.appendChild(
        createPageButton('<', blockStart - 1, {
            disabled: blockStart === 1,
            ariaLabel: '이전 페이지 묶음',
        }),
    );
    for (let page = blockStart; page <= blockEnd; page += 1) {
        pagination.appendChild(
            createPageButton(String(page), page, {
                active: page === currentPage,
            }),
        );
    }
    pagination.appendChild(
        createPageButton('>', blockEnd + 1, {
            disabled: blockEnd === totalPages,
            ariaLabel: '다음 페이지 묶음',
        }),
    );
};

const getPageFromUrl = () => {
    const page = parseInt(new URLSearchParams(location.search).get('page'), 10);
    return Number.isInteger(page) && page > 0 ? page : 1;
};

const syncPageToUrl = page => {
    const url = new URL(location.href);
    if (page === 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(page));
    history.pushState({ page }, '', url);
};

const loadBoardItems = async (page = 1, { pushHistory = false } = {}) => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const result = await getBoardItem(page);
        currentPage = result.currentPage ?? page;
        totalPages = Math.max(result.totalPages ?? 1, 1);

        // 범위를 벗어난 페이지 요청이면 마지막 페이지로 이동
        if ((result.posts ?? []).length === 0 && currentPage > totalPages) {
            isProcessing = false;
            await loadBoardItems(totalPages, { pushHistory });
            return;
        }

        setBoardItem(result.posts);
        renderPagination();
        if (pushHistory) syncPageToUrl(currentPage);
        window.scrollTo({ top: 0 });
    } catch (error) {
        console.error('Error fetching items:', error);
    } finally {
        isProcessing = false;
    }
};

const addPaginationEvent = () => {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    pagination.addEventListener('click', event => {
        const button = event.target.closest('.pageButton');
        if (!button || button.disabled) return;
        loadBoardItems(parseInt(button.dataset.page, 10), {
            pushHistory: true,
        });
    });

    // 뒤로/앞으로 가기 시 해당 페이지 다시 로드
    window.addEventListener('popstate', () => {
        loadBoardItems(getPageFromUrl());
    });
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
        await loadBoardItems(1, { pushHistory: true });
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
        await loadBoardItems(1, { pushHistory: true });
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

        if (!response.ok) {
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
        await loadBoardItems(getPageFromUrl());

        addSearchEvent();
        addSortEvent();
        addPaginationEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
