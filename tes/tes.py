from passlib.context import CryptContext

# 创建密码上下文，指定使用 Argon2 方案
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# 直接对密码字符串进行散列
print(pwd_context.hash("hello"))
print(pwd_context.hash("hell2o"))
print(pwd_context.hash("he2llo"))
print(pwd_context.hash("h2ello"))
print(pwd_context.hash("hel2lo"))
