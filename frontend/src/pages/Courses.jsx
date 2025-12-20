import React, { useEffect, useState } from 'react'
import { Card, Button, Table, message, Space, Typography } from 'antd'
import api from '../services/api'
import CourseForm from '../components/CourseForm'
import { Link } from 'react-router-dom'

export default function Courses() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/course/list')
      // backend currently returns placeholder messages; try to handle list shape
      if (Array.isArray(resp.data)) setData(resp.data)
      else if (resp.data && resp.data.message) {
        message.info(resp.data.message)
        setData([])
      } else {
        setData([])
      }
    } catch (err) {
      message.error('无法获取课程列表')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onCreated = () => {
    setShowCreate(false)
    message.success('已创建课程（若后端实现会返回具体数据）')
    load()
  }

  const columns = [
    { title: '课程名称', dataIndex: 'name', key: 'name', render: (t, r) => <Link to={`/courses/${r.id}`}>{t || r.title || '未命名'}</Link> },
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          课程管理
        </Typography.Title>
        <Button type="primary" onClick={() => setShowCreate(true)}>
          新建课程
        </Button>
      </div>
      <Card>
        <Table rowKey={(r) => r.id || r.name} loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <CourseForm visible={showCreate} onCancel={() => setShowCreate(false)} onCreated={onCreated} />
    </div>
  )
}
