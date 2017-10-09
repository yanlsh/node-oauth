/**
 * Created by zhangfq on 2017/10/5.
 */

exports.configureOauth = function (app,config) {
    app.use(function (req, res, next) {
        if (req.url) {
            if (req.url.indexOf('/auth/cas/login') === 0 || req.session.cas_user_name) {
                return next();
            } else {
                req.session.oldurl = req.url;
                res.redirect('/auth/cas/login');
            }
        } else {
            req.session.oldurl = req.url;
            res.redirect('/auth/cas/login');
        }
    });
    app.get('/auth/cas/login', function (req, res) {
        var OAuth2 = require('./oauth2').OAuth2;
        var clientID = '20170830061623854-E5A8-B2FABDC35';
        var clientSecret = '9c25b1c7cb9641bba4cb8ce4960e24ea';
        var oauth2 = new OAuth2(clientID,
            clientSecret,
            'http://uuapitest.c.citic/',
            '/oauthorize/authorize',
            '/oauthorize/getToken',
            null,
            '/oauthorize/checkTokenValid',
            '/user/getUserInfo'
        );
        var oauth_login_url = oauth2._getAuthorizeUrl();
        // var code = req.sesseion.code;
        var code = req.param("code");
        //判断code
        if (code){
            //从session中获取token
            var token = req.sesseion['access_token'];
            var uid = req.session['cas_user_userId'];
            if (token) {
                //调用token验证方法
                var is_valid = false;
                oauth2.getValidateToken(token,function (error,result,res) {
                    console.log(res);
                    if (result) {
                        var valid_data = JSON.parse(result);
                        is_valid = valid_data['result'];
                    }
                })
                if (is_valid === true) {
                    //如果token验证有效，获取用户信息
                    oauth2.getProtectedResource(token,uid, function (err, result, res) {
                        if (result) {
                            user_data = JSON.parse(result);
                            req.session.cas_user_name = user_data["displayName"];
                            req.session.cas_user_email = user_data["mail"];
                            req.session.cas_user_userId = user_data["uid"];
                            req.session.cas_user_mobile = user_data["mobile"];
                            req.session.cas_user_loginName = user_data["loginName"];
                            req.session.access_token = access_token;
                            console.log(req.session.access_token);
                        }
                    });
                } else {
                    //调用获取token接口，获取新的token，调用获取用户信息接口，并保存用户信息。
                    oauth2.getOAuthAccessToken(code,function (e, access_token, refresh_token, results) {
                        if (e) {
                            console.log(e);
                            res.redirect(oauth_login_url);
                            // oauth2.getCode(function (error,result,res) {
                            //     console.log(res);
                            //     if (result) {
                            //         var code_data = JSON.parse(result);
                            //         code = code_data['code'];
                            //     }
                            // });
                            // req.session.code = code;
                        } else if (results.error) {
                            console.log(results);
                            res.redirect(oauth_login_url);
                            // oauth2.getCode(function (error,result,res) {
                            //     console.log(res);
                            //     if (result) {
                            //         var code_data = JSON.parse(result);
                            //         code = code_data['code'];
                            //     }
                            // });
                            // req.session.code = code;
                        }
                        else {
                            console.log('Obtained access_token: ', access_token);
                            var token_data = JSON.parse(results);
                            token = access_token;
                            uid = token_data['uid'];
                            oauth2.getProtectedResource(token,uid, function (err, result, res) {
                                if (result) {
                                    user_data = JSON.parse(result);
                                    req.session.cas_user_name = user_data["displayName"];
                                    req.session.cas_user_email = user_data["mail"];
                                    req.session.cas_user_userId = user_data["uid"];
                                    req.session.cas_user_mobile = user_data["mobile"];
                                    req.session.cas_user_loginName = user_data["loginName"];
                                    req.session.access_token = token;
                                    console.log(req.session.access_token);
                                }
                            })
                        }
                    });
                }
            } else {
                //调用获取token接口，获取新的token，调用获取用户信息接口，并保存用户信息。
                oauth2.getOAuthAccessToken(code,function (e, access_token, refresh_token, results) {
                    if (e) {
                        console.log(e);
                        res.redirect(oauth_login_url);
                        // dont need to get code
                        // oauth2.getCode(function (error,result,res) {
                        //     console.log(res);
                        //     if (result) {
                        //         var code_data = JSON.parse(result);
                        //         code = code_data['code'];
                        //     }
                        // });
                        // req.session.code = code;
                    } else if (results.error) {
                        console.log(results);
                        res.redirect(oauth_login_url);
                        // oauth2.getCode(function (error,result,res) {
                        //     console.log(res);
                        //     if (result) {
                        //         var code_data = JSON.parse(result);
                        //         code = code_data['code'];
                        //     }
                        // });
                        // req.session.code = code;
                    }
                    else {
                        console.log('Obtained access_token: ', access_token);
                        var token_data = JSON.parse(results);
                        token = access_token;
                        uid = token_data['uid'];
                        oauth2.getProtectedResource(token,uid, function (err, result, res) {
                            if (result) {
                                user_data = JSON.parse(result);
                                req.session.cas_user_name = user_data["displayName"];
                                req.session.cas_user_email = user_data["mail"];
                                req.session.cas_user_userId = user_data["uid"];
                                req.session.cas_user_mobile = user_data["mobile"];
                                req.session.cas_user_loginName = user_data["loginName"];
                                req.session.access_token = token;
                                console.log(req.session.access_token);
                            }
                        })
                    }
                });
            }
        } else {
            //如果没有code，判断是首次登录还是二次登录
            if (req.session.cas_user_name) {
                //如果有用户信息，说明是二次登录，跳转到应用
                res.redirect(req.session.oldurl);
            } else {
                //如果没有用户信息，跳转到登录页面
                res.redirect(oauth_login_url);
                //dont need to get code
                // oauth2.getCode(function (error,result,res) {
                //     console.log(res);
                //     if (result) {
                //         var code_data = JSON.parse(result);
                //         code = code_data['code'];
                //     }
                // });
                // req.session.code = code;
            }
        }
    });
};


