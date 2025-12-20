import React, { useEffect, useState } from 'react'
import { Card, Skeleton, message, Descriptions } from 'antd'
import api from '../services/api'
import { useParams } from 'react-router-dom'

export default function CourseDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const resp = await api.get(`/course/${id}`)
        if (!mounted) return
        if (resp.data && resp.data.message) setData({ message: resp.data.message })
        else setData(resp.data)
      } catch (err) {
        message.error('无法获取课程详情')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  return (
    <Card title="课程详情">
      <Skeleton loading={loading} active>
        {data?.message ? (
          <div>{data.message}</div>
        ) : (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="名称">{data?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="科目">{data?.subject || '-'}</Descriptions.Item>
            <Descriptions.Item label="年级">{data?.grade || '-'}</Descriptions.Item>
            <Descriptions.Item label="简介">{data?.description || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Skeleton>
    </Card>
  )
}
