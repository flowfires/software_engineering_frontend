import React, { useEffect, useState } from 'react'
import { Card, Descriptions, Button, Skeleton, message } from 'antd'
import api from '../services/api'
import useAuthStore from '../stores/authStore'

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const resp = await api.get('/auth/profile')
        if (!mounted) return
        if (resp.data && resp.data.message && Object.keys(resp.data).length === 1) {
          setData({ message: resp.data.message })
        } else {
          setData(resp.data)
        }
      } catch (err) {
        message.error('获取教师信息失败')
        setData({ message: '无法获取用户信息' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (token) load()
    else {
      setLoading(false)
      setData({ message: '未登录' })
    }

    return () => {
      mounted = false
    }
  }, [token])

  return (
    <div>
      <Card title="教师信息">
        <Skeleton loading={loading} active>
          {data?.message ? (
            <div>{data.message}</div>
          ) : (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">{data?.username || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{data?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="姓名">{data?.full_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="角色">{data?.role || '-'}</Descriptions.Item>
            </Descriptions>
          )}
        </Skeleton>
        <div style={{ marginTop: 12 }}>
          <Button type="primary" disabled>编辑信息</Button>
        </div>
      </Card>
    </div>
  )
}
