import React, { useState, useEffect } from 'react'
import { Button, Input, Space, message, Form, Select, InputNumber, Tabs, Modal, Progress } from 'antd'
import api from '../services/api'
import { useParams, useNavigate } from 'react-router-dom'

const { TextArea } = Input
const { TabPane } = Tabs

export default function LessonEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  console.log('LessonEditor - 当前ID:', id)
  
  const [content, setContent] = useState('')
  const [lessonData, setLessonData] = useState({
    lesson_title: '',
    subject: '',
    grade: '',
    lesson_type: '',
    class_duration: 45,
    lesson_count: 1,
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [taskId, setTaskId] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (id && id !== 'new') {
      api.get(`/lesson/${id}`).then((r) => {
        setLessonData({
          lesson_title: r.data?.lesson_title || '',
          subject: r.data?.subject || '',
          grade: r.data?.grade || '',
          lesson_type: r.data?.lesson_type || '',
          class_duration: r.data?.class_duration || 45,
          lesson_count: r.data?.lesson_count || 1,
          notes: r.data?.notes || ''
        })
        const contentStr = r.data?.content 
          ? (typeof r.data.content === 'string' ? r.data.content : JSON.stringify(r.data.content, null, 2))
          : ''
        setContent(contentStr)
      }).catch(err => {
        message.error('加载教案失败')
      })
    }
  }, [id])

  const save = async () => {
    setSaving(true)
    try {
      let contentObj
      try {
        contentObj = JSON.parse(content)
      } catch {
        contentObj = { text: content }
      }

      if (id === 'new' || !id) {
        if (!lessonData.lesson_title.trim()) {
          message.warning('请输入教案标题')
          setSaving(false)
          return
        }
        const resp = await api.post('/lesson', { 
          ...lessonData,
          content: contentObj 
        })
        message.success('已创建')
        navigate(`/lessons/${resp.data.id}`)
      } else {
        await api.put(`/lesson/${id}`, { 
          ...lessonData,
          content: contentObj 
        })
        message.success('已保存')
      }
    } catch (err) {
      console.error('保存失败详情:', err)
      const errorMsg = err?.response?.data?.detail 
        || err?.response?.data?.message
        || err?.message 
        || '保存失败'
      message.error(`保存失败: ${errorMsg}`)
      
      // 如果是422错误，显示验证详情
      if (err?.response?.status === 422 && err?.response?.data?.detail) {
        console.error('验证错误详情:', err.response.data.detail)
      }
    } finally {
      setSaving(false)
    }
  }

  const pollGenerationStatus = async (tid) => {
    try {
      const resp = await api.get('/ai/lesson/generate/status', { params: { task_id: tid } })
      const status = resp.data?.task_status || resp.data?.status
      const progressVal = resp.data?.progress || 0
      
      setProgress(progressVal)
      
      if (status === 'completed' || status === 'SUCCESS') {
        setGenerating(false)
        setTaskId(null)
        if (resp.data?.partial_lesson || resp.data?.lesson) {
          const result = resp.data.partial_lesson || resp.data.lesson
          setContent(JSON.stringify(result, null, 2))
          message.success('AI 生成完成！')
        } else {
          message.info('生成完成，但未返回内容')
        }
      } else if (status === 'failed' || status === 'FAIL') {
        setGenerating(false)
        setTaskId(null)
        message.error(resp.data?.error || 'AI 生成失败')
      } else {
        // 继续轮询
        setTimeout(() => pollGenerationStatus(tid), 2000)
      }
    } catch (err) {
      message.error('查询生成状态失败')
      setGenerating(false)
      setTaskId(null)
    }
  }

  const generateWithAI = async () => {
    if (!lessonData.lesson_title) {
      message.warning('请先输入教案标题')
      return
    }
    
    setGenerating(true)
    setProgress(0)
    
    try {
      const clarifyData = {
        subject: lessonData.subject,
        grade: lessonData.grade,
        lesson_title: lessonData.lesson_title,
        lesson_type: lessonData.lesson_type,
        class_duration: lessonData.class_duration,
        lesson_count: lessonData.lesson_count,
        notes: lessonData.notes
      }
      
      const r = await api.post('/ai/lesson/generate', { clarify: clarifyData })
      if (r.data?.task_id) {
        const tid = r.data.task_id
        setTaskId(tid)
        message.info('AI 生成任务已提交，正在生成中...')
        pollGenerationStatus(tid)
      } else {
        setGenerating(false)
        message.error('未返回任务ID')
      }
    } catch (err) {
      setGenerating(false)
      message.error(err?.response?.data?.detail || 'AI 生成失败')
    }
  }

  const updateSection = async (sectionKey) => {
    if (id === 'new') {
      message.warning('请先保存教案')
      return
    }
    
    Modal.confirm({
      title: '更新章节',
      content: (
        <div>
          <p>章节key: {sectionKey}</p>
          <TextArea 
            rows={4} 
            placeholder="输入章节内容"
            id="section-content-input"
          />
        </div>
      ),
      onOk: async () => {
        const sectionContent = document.getElementById('section-content-input').value
        try {
          await api.patch(`/lesson/${id}/section`, {
            section_key: sectionKey,
            content: sectionContent
          })
          message.success('章节已更新')
          // 重新加载教案
          const r = await api.get(`/lesson/${id}`)
          const contentStr = r.data?.content 
            ? (typeof r.data.content === 'string' ? r.data.content : JSON.stringify(r.data.content, null, 2))
            : ''
          setContent(contentStr)
        } catch (err) {
          message.error(err?.response?.data?.detail || '更新章节失败')
        }
      }
    })
  }

  return (
    <div style={{ padding: 20 }}>
      <Form layout="vertical">
        <Form.Item label="教案标题" required>
          <Input 
            value={lessonData.lesson_title}
            onChange={(e) => setLessonData({ ...lessonData, lesson_title: e.target.value })}
            placeholder="请输入教案标题"
          />
        </Form.Item>
        
        <Space style={{ width: '100%', marginBottom: 16 }}>
          <Form.Item label="科目">
            <Input
              value={lessonData.subject}
              onChange={(e) => setLessonData({ ...lessonData, subject: e.target.value })}
              style={{ width: 120 }}
              placeholder="输入科目"
            />
          </Form.Item>
          
          <Form.Item label="年级">
            <Select 
              value={lessonData.grade}
              onChange={(val) => setLessonData({ ...lessonData, grade: val })}
              style={{ width: 120 }}
              placeholder="选择年级"
            >
              <Select.Option value="一年级">一年级</Select.Option>
              <Select.Option value="二年级">二年级</Select.Option>
              <Select.Option value="三年级">三年级</Select.Option>
              <Select.Option value="四年级">四年级</Select.Option>
              <Select.Option value="五年级">五年级</Select.Option>
              <Select.Option value="六年级">六年级</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="课型">
            <Select 
              value={lessonData.lesson_type}
              onChange={(val) => setLessonData({ ...lessonData, lesson_type: val })}
              style={{ width: 120 }}
              placeholder="选择课型"
            >
              <Select.Option value="新授课">新授课</Select.Option>
              <Select.Option value="复习课">复习课</Select.Option>
              <Select.Option value="练习课">练习课</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="课时（分钟）">
            <InputNumber 
              value={lessonData.class_duration}
              onChange={(val) => setLessonData({ ...lessonData, class_duration: val })}
              min={1}
              max={120}
            />
          </Form.Item>
          
          <Form.Item label="课时数量">
            <InputNumber 
              value={lessonData.lesson_count}
              onChange={(val) => setLessonData({ ...lessonData, lesson_count: val })}
              min={1}
              max={10}
            />
          </Form.Item>
        </Space>
        
        <Form.Item label="备注">
          <TextArea 
            value={lessonData.notes}
            onChange={(e) => setLessonData({ ...lessonData, notes: e.target.value })}
            rows={2}
            placeholder="其他说明或要求"
          />
        </Form.Item>
        
        {generating && (
          <div style={{ marginBottom: 16 }}>
            <Progress percent={progress} status="active" />
            <div style={{ textAlign: 'center', marginTop: 8, color: '#999' }}>
              AI 正在生成教案内容，请稍候...
            </div>
          </div>
        )}
        
        <Tabs defaultActiveKey="1">
          <TabPane tab="编辑内容" key="1">
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              placeholder="在此输入或编辑教案内容（支持JSON格式）"
            />
          </TabPane>
          <TabPane tab="章节管理" key="2">
            <div>
              <p>输入章节key更新内容：</p>
              <Space>
                <Input placeholder="例如: objectives, teaching_process" id="section-key-input" />
                <Button onClick={() => {
                  const key = document.getElementById('section-key-input').value
                  if (key) updateSection(key)
                }}>
                  更新章节
                </Button>
              </Space>
              <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
                常见章节: objectives（教学目标）, teaching_process（教学过程）, homework（作业）
              </div>
            </div>
          </TabPane>
        </Tabs>
        
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button onClick={save} type="primary" loading={saving}>
              保存
            </Button>
            <Button onClick={generateWithAI} loading={generating} disabled={generating}>
              {generating ? '生成中...' : 'AI 生成'}
            </Button>
            <Button onClick={() => navigate('/lessons')}>返回列表</Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}
