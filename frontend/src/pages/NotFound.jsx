import React from 'react'
import { Result, Button } from 'antd'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <Result status="404" title="404" subTitle="页面未找到">
      <Button type="primary">
        <Link to="/">返回首页</Link>
      </Button>
    </Result>
  )
}
