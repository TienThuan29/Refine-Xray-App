
export const PageUrl = {

    HOME_PAGE: '/',
    LOGIN_PAGE: '/login',

    Doctor: {
        HOME_PAGE: '/doctors',
        BLOG_PAGE: '/doctors/blog',
        BLOG_DETAIL: (id: string) => `/doctors/blog/${id}`,
    },

    Admin: {
        HOME_PAGE: '/admin',
    }
}