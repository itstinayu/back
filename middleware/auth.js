import passport from 'passport'
import jsonwebtoken from 'jsonwebtoken'

export const login = (req, res, next) => {
  // 使用 login 驗證方式
  // (error, user, info) 對應到 done 的三個參數
  // { session: false } 停用 cookie
  passport.authenticate('login', { session: false }, (error, user, info) => {
    if (error || !user) {
      if (info) {
        // POST 進來的資料少了 usernameField 或 passwordField 時
        if (info.message === 'Missing credentials') info.message = '欄位錯誤'
        return res.status(401).json({ success: false, message: info.message || error.message })
      } else {
        return res.status(500).json({ success: false, message: '未知錯誤' })
      }
    }
    // 把查詢到的 user 放進 req 裡給後面的 controller 用
    req.user = user
    // 繼續下一步
    next()
  })(req, res, next)
}

export const jwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, data, info) => {
    if (error || !data) {
      // 如果是 JWT 錯誤
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        if (info.name === 'TokenExpiredError') {
          /*
            app.use('/users', userRouter)
            router.get('/me')
            http://www.example.com/users/me?aaa=bbb&ccc=ddd
            console.log(req.originalUrl) --> /users/me?aaa=bbb&ccc=ddd'
            console.log(req.baseUrl) --> /users'
            console.log(req.path) --> /me'
            console.log(req.baseUrl + req.path) --> /users/me
          */
          // 只允許 /users/logout 和 /users/extend 的過期請求
          if (req.baseUrl !== '/users' || (req.path !== '/logout' && req.path !== '/extend')) {
            return res.status(401).json({ success: false, message: 'JWT 過期' })
          }
        } else {
          return res.status(401).json({ success: false, message: 'JWT 錯誤' })
        }
      } else {
        return res.status(401).json({ success: false, message: info.message || '未知錯誤' })
      }
    }
    req.user = data.user
    req.token = data.token
    next()
  })(req, res, next)
}
