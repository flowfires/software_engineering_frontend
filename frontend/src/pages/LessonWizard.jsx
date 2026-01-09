import React, { useState, useEffect } from 'react'
import { Steps, Button, Input, Select, message, Card, Modal, Form, InputNumber, List, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const { Step } = Steps
const { TextArea } = Input

export default function LessonWizard() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // 步骤1: 选择模板
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  
  // 步骤2: 填写基本信息
  const [basicInfo, setBasicInfo] = useState({
    lesson_title: '',
    subject: '',
    grade: '',
    lesson_type: '新授课',
    class_duration: 45,
    lesson_count: 1,
    notes: ''
  })
  
  // 步骤3: AI对话澄清
  const [sessionId, setSessionId] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [userMessage, setUserMessage] = useState('')
  const [clarifyComplete, setClarifyComplete] = useState(false)
  
  // 步骤4: 生成教案
  const [taskId, setTaskId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [generatedLesson, setGeneratedLesson] = useState(null)

  // 加载模板列表
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const resp = await api.get('/ai/lesson/templates')
      if (resp.data && Array.isArray(resp.data.templates || resp.data)) {
        setTemplates(resp.data.templates || resp.data)
      } else {
        setTemplates([])
      }
    } catch (err) {
      // 如果API未实现，使用默认模板
      setTemplates([
        { id: 'default', name: '标准教案模板', description: '适用于常规课程教学' },
        { id: 'interactive', name: '互动式教案', description: '强调师生互动和实践活动' },
        { id: 'project', name: '项目式教案', description: '以项目为中心的教学设计' }
      ])
    }
  }

  // 步骤1: 下一步（选择模板后）
  const handleTemplateNext = () => {
    if (!selectedTemplate) {
      message.warning('请选择一个教案模板')
      return
    }
    setCurrentStep(1)
  }

  // 步骤2: 下一步（填写基本信息后）
  const handleBasicInfoNext = async () => {
    if (!basicInfo.lesson_title || !basicInfo.subject || !basicInfo.grade) {
      message.warning('请填写必填项：标题、科目、年级')
      return
    }
    
    // 初始化澄清对话会话
    setLoading(true)
    try {
      const resp = await api.post('/ai/lesson/clarify/chat', {
        session_id: null,
        user_message: `我想创建一个${basicInfo.subject}${basicInfo.grade}的教案，标题是《${basicInfo.lesson_title}》`,
        clarify: basicInfo
      })
      
      if (resp.data?.session_id) {
        setSessionId(resp.data.session_id)
        const aiMsg = resp.data.ai_message || '您好！我将协助您完善教案设计。请问您对这节课有什么特殊要求吗？'
        setChatHistory([{ role: 'ai', content: aiMsg }])
        setCurrentStep(2)
      } else {
        // 如果API未实现，跳过对话直接生成
        message.info('对话功能暂不可用，将直接生成教案')
        setCurrentStep(3)
        handleGenerate()
      }
    } catch (err) {
      message.error('初始化对话失败，将直接生成教案')
      setCurrentStep(3)
      handleGenerate()
    } finally {
      setLoading(false)
    }
  }

  // 步骤3: 发送消息
  const handleSendMessage = async () => {
    if (!userMessage.trim()) {
      message.warning('请输入消息')
      return
    }
    
    const newUserMsg = { role: 'user', content: userMessage }
    setChatHistory([...chatHistory, newUserMsg])
    
    const currentMessage = userMessage
    setUserMessage('')
    setLoading(true)
    
    try {
      const resp = await api.post('/ai/lesson/clarify/chat', {
        session_id: sessionId,
        user_message: currentMessage,
        clarify: basicInfo
      })
      
      const aiMsg = resp.data?.ai_message || '好的，我明白了。'
      setChatHistory(prev => [...prev, { role: 'ai', content: aiMsg }])
      
      // 检查是否完成澄清
      if (resp.data?.clarify_complete || resp.data?.is_complete) {
        setClarifyComplete(true)
        message.success('信息收集完成，可以开始生成教案了！')
      }
    } catch (err) {
      message.error('发送消息失败')
      setChatHistory(prev => [...prev, { role: 'ai', content: '抱歉，出现了错误。' }])
    } finally {
      setLoading(false)
    }
  }

  // 步骤3: 跳过对话直接生成
  const handleSkipClarify = () => {
    setCurrentStep(3)
    handleGenerate()
  }

  // 步骤4: 生成教案
  const handleGenerate = async () => {
    setLoading(true)
    setProgress(0)
    
    try {
      const clarifyData = {
        ...basicInfo,
        template_id: selectedTemplate?.id,
        session_id: sessionId
      }
      
      const resp = await api.post('/ai/lesson/generate', { clarify: clarifyData })
      
      if (resp.data?.task_id) {
        setTaskId(resp.data.task_id)
        message.info('教案生成任务已提交，正在生成中...')
        pollGenerationStatus(resp.data.task_id)
      } else {
        message.error('未返回任务ID')
        setLoading(false)
      }
    } catch (err) {
      message.error(err?.response?.data?.detail || '生成失败')
      setLoading(false)
    }
  }

  // 轮询生成状态
  const pollGenerationStatus = async (tid) => {
    try {
      const resp = await api.get('/ai/lesson/generate/status', { params: { task_id: tid } })
      const status = resp.data?.task_status || resp.data?.status
      const progressVal = resp.data?.progress || 0
      
      setProgress(progressVal)
      
      if (status === 'completed' || status === 'SUCCESS') {
        setLoading(false)
        if (resp.data?.partial_lesson || resp.data?.lesson) {
          const result = resp.data.partial_lesson || resp.data.lesson
          setGeneratedLesson(result)
          message.success('教案生成完成！')
        } else {
          message.info('生成完成，但未返回内容')
        }
      } else if (status === 'failed' || status === 'FAIL') {
        setLoading(false)
        message.error(resp.data?.error || '生成失败')
      } else {
        // 继续轮询
        setTimeout(() => pollGenerationStatus(tid), 2000)
      }
    } catch (err) {
      message.error('查询状态失败')
      setLoading(false)
    }
  }

  // 保存并查看教案
  const handleSaveAndView = async () => {
    if (!generatedLesson) {
      message.warning('没有可保存的教案')
      return
    }
    
    setLoading(true)
    try {
      const resp = await api.post('/lesson', {
        ...basicInfo,
        content: generatedLesson
      })
      message.success('教案已保存')
      navigate(`/lessons/${resp.data.id}`)
    } catch (err) {
      message.error(err?.response?.data?.detail || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h1>AI教案生成向导</h1>
      
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        <Step title="选择模板" />
        <Step title="填写信息" />
        <Step title="澄清细节" />
        <Step title="生成教案" />
      </Steps>

      {/* 步骤1: 选择模板 */}
      {currentStep === 0 && (
        <Card>
          <h2>选择教案模板</h2>
          <List
            grid={{ gutter: 16, column: 2 }}
            dataSource={templates}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  style={{
                    border: selectedTemplate?.id === item.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                  }}
                  onClick={() => setSelectedTemplate(item)}
                >
                  <h3>{item.name}</h3>
                  <p style={{ color: '#666' }}>{item.description}</p>
                </Card>
              </List.Item>
            )}
          />
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" onClick={handleTemplateNext}>
              下一步
            </Button>
          </div>
        </Card>
      )}

      {/* 步骤2: 填写基本信息 */}
      {currentStep === 1 && (
        <Card>
          <h2>填写教案基本信息</h2>
          <Form layout="vertical">
            <Form.Item label="教案标题" required>
              <Input
                value={basicInfo.lesson_title}
                onChange={(e) => setBasicInfo({ ...basicInfo, lesson_title: e.target.value })}
                placeholder="例如：认识分数"
              />
            </Form.Item>
            
            <Form.Item label="科目" required>
              <Input
                value={basicInfo.subject}
                onChange={(e) => setBasicInfo({ ...basicInfo, subject: e.target.value })}
                placeholder="输入科目"
              />
            </Form.Item>
            
            <Form.Item label="年级" required>
              <Select
                value={basicInfo.grade}
                onChange={(val) => setBasicInfo({ ...basicInfo, grade: val })}
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
                value={basicInfo.lesson_type}
                onChange={(val) => setBasicInfo({ ...basicInfo, lesson_type: val })}
              >
                <Select.Option value="新授课">新授课</Select.Option>
                <Select.Option value="复习课">复习课</Select.Option>
                <Select.Option value="练习课">练习课</Select.Option>
              </Select>
            </Form.Item>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item label="课时（分钟）">
                <InputNumber
                  value={basicInfo.class_duration}
                  onChange={(val) => setBasicInfo({ ...basicInfo, class_duration: val })}
                  min={1}
                  max={120}
                />
              </Form.Item>
              
              <Form.Item label="课时数量">
                <InputNumber
                  value={basicInfo.lesson_count}
                  onChange={(val) => setBasicInfo({ ...basicInfo, lesson_count: val })}
                  min={1}
                  max={10}
                />
              </Form.Item>
            </div>
            
            <Form.Item label="其他说明">
              <TextArea
                value={basicInfo.notes}
                onChange={(e) => setBasicInfo({ ...basicInfo, notes: e.target.value })}
                rows={3}
                placeholder="任何特殊要求或说明"
              />
            </Form.Item>
          </Form>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>上一步</Button>
            <Button type="primary" onClick={handleBasicInfoNext} loading={loading}>
              下一步
            </Button>
          </div>
        </Card>
      )}

      {/* 步骤3: AI对话澄清 */}
      {currentStep === 2 && (
        <Card>
          <h2>与AI对话，澄清教案细节</h2>
          <div style={{ 
            height: 400, 
            overflowY: 'auto', 
            border: '1px solid #d9d9d9', 
            padding: 16,
            marginBottom: 16,
            backgroundColor: '#fafafa'
          }}>
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: msg.role === 'ai' ? '#e6f7ff' : '#fff',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: 4, color: msg.role === 'ai' ? '#1890ff' : '#52c41a' }}>
                  {msg.role === 'ai' ? 'AI助手' : '我'}
                </div>
                <div>{msg.content}</div>
              </div>
            ))}
            {loading && <Spin tip="AI正在回复..." />}
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Input
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onPressEnter={handleSendMessage}
              placeholder="输入您的回答或问题..."
              disabled={loading}
            />
            <Button type="primary" onClick={handleSendMessage} loading={loading}>
              发送
            </Button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(1)}>上一步</Button>
            <div>
              <Button onClick={handleSkipClarify} style={{ marginRight: 8 }}>
                跳过对话
              </Button>
              <Button 
                type="primary" 
                onClick={() => {
                  setCurrentStep(3)
                  handleGenerate()
                }}
                disabled={!clarifyComplete && chatHistory.length < 2}
              >
                完成澄清，开始生成
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 步骤4: 生成教案 */}
      {currentStep === 3 && (
        <Card>
          <h2>生成教案中...</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, fontSize: 16 }}>AI正在生成教案，请稍候...</div>
              <div style={{ marginTop: 8, color: '#999' }}>进度: {progress}%</div>
            </div>
          ) : generatedLesson ? (
            <div>
              <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                <h3>生成完成！</h3>
                <p>教案已成功生成，您可以查看和保存。</p>
              </div>
              <TextArea
                value={JSON.stringify(generatedLesson, null, 2)}
                rows={15}
                readOnly
                style={{ fontFamily: 'monospace' }}
              />
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Button onClick={() => navigate('/lessons')} style={{ marginRight: 8 }}>
                  返回列表
                </Button>
                <Button type="primary" onClick={handleSaveAndView} loading={loading}>
                  保存并查看
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p>生成失败或已取消</p>
              <Button onClick={() => setCurrentStep(1)}>返回修改</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
