import React, { useEffect, useState } from 'react'
import { Button, Card, List, message, Spin, Empty, Modal, Select, Input, Space, Tag } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { PlusOutlined, EditOutlined, DeleteOutlined, FormOutlined } from '@ant-design/icons'
import api from '../services/api'

export default function Exercises() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({ subject: null, difficulty: null })

  const load = async (page = 1, filterParams = filters) => {
    setLoading(true)
    try {
      const params = { page, page_size: pagination.pageSize }
      if (filterParams.subject) params.subject = filterParams.subject
      if (filterParams.difficulty) params.difficulty = filterParams.difficulty

      const resp = await api.get('/ai/exercise/list', { params })

      if (resp.data && Array.isArray(resp.data.items || resp.data)) {
        setData(resp.data.items || resp.data)
        setPagination(prev => ({
          ...prev,
          page,
          total: resp.data.total || (resp.data.items || resp.data).length
        }))
      } else {
        setData([])
      }
    } catch (err) {
      console.warn('加载习题列表失败', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除习题集「${title}」吗？此操作不可恢复。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/ai/exercise/${id}`)
          message.success('删除成功')
          load(pagination.page)
        } catch (err) {
          message.error(err?.response?.data?.detail || '删除失败')
        }
      }
    })
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    load(1, newFilters)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input
              placeholder="筛选科目"
              style={{ width: 140 }}
              allowClear
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            />
            <Select
              placeholder="筛选难度"
              style={{ width: 120 }}
              allowClear
              value={filters.difficulty}
              onChange={(val) => handleFilterChange('difficulty', val)}
            >
              <Select.Option value="基础">基础</Select.Option>
              <Select.Option value="中等">中等</Select.Option>
              <Select.Option value="进阶">进阶</Select.Option>
              <Select.Option value="拔高">拔高</Select.Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/exercises/new')}>
            AI 智能出题
          </Button>
        </div>
      </Space>
      
      <Spin spinning={loading}>
        {data.length === 0 && !loading ? (
          <Empty description={
            <span>暂无习题，点击右上角 <Link to="/exercises/new">AI 智能出题</Link></span>
          } />
        ) : (
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={data}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (p) => load(p),
              showTotal: (total) => `共 ${total} 套`
            }}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  hoverable
                  title={item.title || '未命名习题'}
                  extra={
                    <Tag color={
                      item.overall_difficulty === '基础' ? 'green' : 
                      item.overall_difficulty === '拔高' ? 'red' : 'blue'
                    }>
                      {item.overall_difficulty || '未分级'}
                    </Tag>
                  }
                  actions={[
                    <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/exercises/${item.id}`)}>编辑</Button>,
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id, item.title)}>删除</Button>
                  ]}
                >
                  <div style={{ minHeight: 60 }}>
                    <div style={{ marginBottom: 8 }}>
                      <FormOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                      <span style={{ fontWeight: 500 }}>{item.exercises ? item.exercises.length : 0} 道题</span>
                      {item.suggested_duration_minutes && (
                        <span style={{ marginLeft: 16, color: '#666' }}>
                          ⏱ {item.suggested_duration_minutes} 分钟
                        </span>
                      )}
                    </div>
                    {item.purpose && <div style={{ color: '#666', fontSize: 13 }}>用途: {item.purpose}</div>}
                    {item.subject && <div style={{ color: '#666', fontSize: 13 }}>科目: {item.subject}</div>}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  )
}