import React, { useState, useEffect } from 'react'
import { Button, Input, Space, message } from 'antd'
import api from '../services/api'
import { useParams, useNavigate } from 'react-router-dom'

const { TextArea } = Input

export default function LessonEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id && id !== 'new') {
      // load lesson
      api.get(`/lesson/${id}`).then((r) => setContent(r.data?.current_content || ''))
    }
  }, [id])

  const save = async () => {
    setSaving(true)
    try {
      if (id === 'new') {
        const resp = await api.post('/lesson', { content })
        message.success('已创建')
        navigate(`/lessons/${resp.data.id}`)
      } else {
        await api.put(`/lesson/${id}`, { content })
        message.success('已保存')
      }
    } catch (err) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const generateWithAI = async () => {
    try {
      const r = await api.post('/ai/lesson/generate', { prompt: content.slice(0, 200) })
      setContent((c) => c + '\n\n' + (r.data?.result || ''))
      message.success('AI 生成已追加')
    } catch (err) {
      message.error('AI 生成失败')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={save} loading={saving}>
          保存
        </Button>
        <Button onClick={generateWithAI}>AI 生成</Button>
      </Space>
      <TextArea value={content} onChange={(e) => setContent(e.target.value)} rows={20} />
    </div>
  )
}
