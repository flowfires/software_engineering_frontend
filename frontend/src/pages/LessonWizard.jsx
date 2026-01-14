import React, { useState, useEffect, useRef } from 'react'
import { Steps, Button, Input, Select, message, Card, Form, InputNumber, Spin, Alert } from 'antd'
import { useNavigate } from 'react-router-dom'
import { RobotOutlined, UserOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Step } = Steps
const { TextArea } = Input

// 生成 UUID
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function LessonWizard() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // 步骤0: 填写基本信息
  const [basicInfo, setBasicInfo] = useState({
    lesson_title: '',
    subject: '',
    grade: '',
    lesson_type: '新授课',
    class_duration: 45,
    lesson_count: 1,
    notes: ''
  })
  
  // 步骤1: AI对话澄清
  const [sessionId, setSessionId] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [userMessage, setUserMessage] = useState('')
  
  // 步骤2: 生成状态管理
  const [taskId, setTaskId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [generatedLesson, setGeneratedLesson] = useState(null)
  const [statusMsg, setStatusMsg] = useState('准备生成...')
  
  const chatEndRef = useRef(null)
  
  useEffect(() => {
    if (currentStep === 1 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, currentStep])

  // 1. 初始化会话
  const handleBasicInfoNext = async () => {
    if (!basicInfo.lesson_title || !basicInfo.subject || !basicInfo.grade) {
      message.warning('请填写必填项：标题、科目、年级')
      return
    }
    
    const newSessionId = generateUUID()
    setSessionId(newSessionId)
    setLoading(true)

    const initialMessage = `我想设计一份教案。
    课题：《${basicInfo.lesson_title}》
    科目：${basicInfo.subject}
    年级：${basicInfo.grade}
    课型：${basicInfo.lesson_type}
    时长：${basicInfo.class_duration}分钟
    备注要求：${basicInfo.notes || '无'}
    请帮我规划教学流程，如果有需要补充的信息请问我。`

    setChatHistory([{ role: 'user', content: initialMessage }])

    try {
      const resp = await api.post('/ai/lesson/clarify/chat', {
        session_id: newSessionId,
        message: initialMessage
      })
      
      const aiMsg = resp.data?.assistant_reply || resp.data?.message || '收到，请问您对教学目标有什么具体要求吗？'
      setChatHistory(prev => [...prev, { role: 'ai', content: aiMsg }])
      setCurrentStep(1) 
    } catch (err) {
      console.error(err)
      message.error('初始化对话失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 2. 发送消息
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return
    
    const newUserMsg = { role: 'user', content: userMessage }
    setChatHistory(prev => [...prev, newUserMsg])
    
    const currentMessage = userMessage
    setUserMessage('')
    setLoading(true)
    
    try {
      const resp = await api.post('/ai/lesson/clarify/chat', {
        session_id: sessionId,
        message: currentMessage
      })
      
      const aiMsg = resp.data?.assistant_reply || resp.data?.message || '收到。'
      setChatHistory(prev => [...prev, { role: 'ai', content: aiMsg }])
    } catch (err) {
      message.error('发送消息失败')
      setChatHistory(prev => [...prev, { role: 'ai', content: '（网络错误，请重试）' }])
    } finally {
      setLoading(false)
    }
  }

  // 3. 触发生成 (留在本页)
  const handleGenerate = async () => {
    setCurrentStep(2) // 进入生成页
    setLoading(true)
    setProgress(0)
    setStatusMsg('正在提交生成任务...')
    
    try {
      const payload = {
        session_id: sessionId, 
        template_id: 'default-v1', 
        confirm_md_final: "用户确认生成", 
        clarify: basicInfo 
      }

      const resp = await api.post('/ai/lesson/generate', payload)
      
      if (resp.data?.task_id) {
        setTaskId(resp.data.task_id)
        setStatusMsg('AI 正在撰写教案，请稍候...')
        pollGenerationStatus(resp.data.task_id)
      } else {
        message.error('提交失败：未返回任务ID')
        setLoading(false)
        setCurrentStep(1)
      }
    } catch (err) {
      message.error(err?.response?.data?.detail || '提交生成请求失败')
      setLoading(false)
      setCurrentStep(1)
    }
  }

  // 4. 轮询状态
  const pollGenerationStatus = async (tid) => {
    try {
      const resp = await api.get('/ai/lesson/generate/status', { params: { task_id: tid } })
      const status = resp.data?.task_status || resp.data?.status
      const progressVal = resp.data?.progress || 0
      
      setProgress(progressVal)
      
      if (status === 'completed' || status === 'SUCCESS') {
        setLoading(false)
        const result = resp.data?.partial_lesson || resp.data?.lesson
        if (result) {
          setGeneratedLesson(result)
          message.success('教案生成完成！')
        }
      } else if (status === 'failed' || status === 'FAIL') {
        setLoading(false)
        message.error(resp.data?.error || '生成失败，请重试')
      } else {
        setTimeout(() => pollGenerationStatus(tid), 2000)
      }
    } catch (err) {
      setStatusMsg('网络波动，正在重试...')
      setTimeout(() => pollGenerationStatus(tid), 3000)
    }
  }

  // 5. 保存并查看
  const handleSaveAndView = async () => {
    if (!generatedLesson) return
    setLoading(true)
    try {
      const resp = await api.post('/lesson', {
        ...basicInfo,
        content: generatedLesson
      })
      message.success('教案已保存')
      // 兼容 ID 获取
      const newId = resp.data?.id || resp.data?.lesson?.id || resp.data?.data?.id
      if (newId) {
        navigate(`/lessons/${newId}`)
      } else {
        navigate('/lessons')
      }
    } catch (err) {
      message.error(err?.response?.data?.detail || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1>AI 教案生成向导</h1>
      
      <Steps current={currentStep} style={{ marginBottom: 40 }}>
        <Step title="基本信息" description="设定课题与要求" />
        <Step title="智能澄清" description="与 AI 沟通细节" />
        <Step title="生成结果" description="查看并保存教案" />
      </Steps>

      {/* 步骤0: 填写基本信息 */}
      {currentStep === 0 && (
        <Card title="第一步：填写教案信息" bordered={false}>
          <Form layout="vertical">
            <Form.Item label="教案标题" required>
              <Input
                size="large"
                value={basicInfo.lesson_title}
                onChange={(e) => setBasicInfo({ ...basicInfo, lesson_title: e.target.value })}
                placeholder="例如：勾股定理的初步认识"
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: 20 }}>
              <Form.Item label="科目" required style={{ flex: 1 }}>
                <Input
                  value={basicInfo.subject}
                  onChange={(e) => setBasicInfo({ ...basicInfo, subject: e.target.value })}
                  placeholder="例如：数学"
                />
              </Form.Item>
              <Form.Item label="年级" required style={{ flex: 1 }}>
                <Select
                  value={basicInfo.grade}
                  onChange={(val) => setBasicInfo({ ...basicInfo, grade: val })}
                  placeholder="选择年级"
                >
                  {['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三'].map(g => (
                    <Select.Option key={g} value={g}>{g}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Form.Item label="课型" style={{ flex: 1 }}>
                <Select
                  value={basicInfo.lesson_type}
                  onChange={(val) => setBasicInfo({ ...basicInfo, lesson_type: val })}
                >
                  <Select.Option value="新授课">新授课</Select.Option>
                  <Select.Option value="复习课">复习课</Select.Option>
                  <Select.Option value="习题课">习题课</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="课时时长 (分钟)" style={{ flex: 1 }}>
                <InputNumber
                  style={{ width: '100%' }}
                  value={basicInfo.class_duration}
                  onChange={(val) => setBasicInfo({ ...basicInfo, class_duration: val })}
                  min={10} max={180}
                />
              </Form.Item>
            </div>
            <Form.Item label="备注要求 (可选)">
              <TextArea
                value={basicInfo.notes}
                onChange={(e) => setBasicInfo({ ...basicInfo, notes: e.target.value })}
                rows={3}
                placeholder="例如：希望包含一个具体的历史故事导入..."
              />
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button type="primary" size="large" onClick={handleBasicInfoNext} loading={loading} icon={<RobotOutlined />}>
              下一步：智能对话
            </Button>
          </div>
        </Card>
      )}

      {/* 步骤1: AI对话澄清 */}
      {currentStep === 1 && (
        <Card title="第二步：与 AI 沟通细节" bordered={false}>
          <div style={{ 
            height: 400, 
            overflowY: 'auto', 
            border: '1px solid #f0f0f0', 
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
            backgroundColor: '#fafafa'
          }}>
            {chatHistory.map((msg, idx) => {
              const isAi = msg.role === 'ai'
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  flexDirection: isAi ? 'row' : 'row-reverse',
                  marginBottom: 16 
                }}>
                  <div style={{ 
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    backgroundColor: isAi ? '#fff' : '#1890ff',
                    color: isAi ? '#333' : '#fff',
                    border: isAi ? '1px solid #e8e8e8' : 'none',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.7, fontWeight: 'bold' }}>
                      {isAi ? <><RobotOutlined /> AI 助手</> : <><UserOutlined /> 我</>}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</div>
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <Input
              size="large"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onPressEnter={handleSendMessage}
              placeholder="请输入您的补充要求..."
              disabled={loading}
            />
            <Button size="large" onClick={handleSendMessage} loading={loading} icon={<SendOutlined />}>
              发送
            </Button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
            <Button onClick={() => setCurrentStep(0)}>返回修改信息</Button>
            <Button type="primary" size="large" onClick={handleGenerate} icon={<ThunderboltOutlined />} disabled={loading}>
              确认无误，开始生成
            </Button>
          </div>
        </Card>
      )}

      {/* 步骤2: 生成结果 (进度条 + 结果预览) */}
      {currentStep === 2 && (
        <Card title="第三步：生成结果" bordered={false}>
          {!generatedLesson ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" tip={statusMsg} />
              <div style={{ width: 300, margin: '20px auto' }}>
                <div style={{ height: 6, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: '#1890ff', transition: 'width 0.3s' }} />
                </div>
                <div style={{ marginTop: 8, color: '#666' }}>生成进度: {progress}%</div>
              </div>
            </div>
          ) : (
            <div>
              <Alert 
                message="生成成功" 
                description="教案已生成，请点击右下角按钮保存。" 
                type="success" 
                showIcon 
                style={{ marginBottom: 20 }}
              />
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#fafafa', padding: '8px 16px', borderBottom: '1px solid #d9d9d9', fontWeight: 'bold' }}>
                  预览 (JSON)
                </div>
                <TextArea
                  value={JSON.stringify(generatedLesson, null, 2)}
                  rows={20}
                  readOnly
                  style={{ border: 'none', resize: 'none', fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button onClick={() => setCurrentStep(1)} style={{ marginRight: 12 }}>
                  返回修改
                </Button>
                <Button type="primary" size="large" onClick={handleSaveAndView} loading={loading}>
                  保存并查看教案
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}