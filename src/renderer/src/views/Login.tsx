import { Card, CardBody, Tooltip } from '@nextui-org/react'
import { ReactElement, useEffect, useState } from 'react'
import { useQRCode } from 'next-qrcode'
import apis from '@renderer/apis/default'
import router from '../router'
import { QrPollCodeEnum } from '../utils/constans'

function Login(): ReactElement | null {
  console.log('Login')
  console.log('window.api', window.api)
  const { Canvas } = useQRCode()
  const [qrText, setQrText] = useState('哔哩哔哩登录扫码')
  const [qrTipText, setQrTipText] = useState('点击刷新')
  let qrPollTimer: ReturnType<typeof setInterval>,
    qrcode_key = ''
  const qrPollTimerOut = 3000

  async function qrGen(): Promise<void> {
    const res = await apis.qrGenerate<QrGenerateResult>()
    console.log('renderer-qrGen')
    console.log('renderer-QrGenerateResult', res)

    qrcode_key = res.qrcode_key
    setQrText(res.url)
    setQrTipText('已生成二维码')
    qrPollTimer = setInterval(() => {
      qrPoll()
    }, qrPollTimerOut)
  }

  async function qrPoll(): Promise<void> {
    const res = await apis.qrPoll<QrPollResult, QrPollParams>({ qrcode_key })
    console.log('renderer-qrPoll')
    console.log('renderer-QrPollResult', res)
    console.log('renderer-qrcode_key', qrcode_key)
    switch (res.code) {
      case QrPollCodeEnum.SUCCESS:
        clearInterval(qrPollTimer)
        //持久化 refresh_token
        localStorage.setItem('ac_time_value', res.refresh_token)
        router.navigate('/')

        break
      case QrPollCodeEnum.EXPIRES:
        clearInterval(qrPollTimer)
        qrGen()
        break
      case QrPollCodeEnum.UNSCAN:
        break
      case QrPollCodeEnum.UNCONFIRM:
        break
    }
  }

  function refreshQR(): void {
    setQrTipText('正在生成新二维码')
    qrGen()
  }

  useEffect(() => {
    console.log('renderer-Login useEffect')
    qrGen()
  }, [])

  return (
    <>
      <Tooltip color={'primary'} content={qrTipText}>
        <Card shadow="sm" isPressable onPress={refreshQR}>
          <CardBody>
            <Canvas
              text={qrText}
              options={{
                errorCorrectionLevel: 'M',
                margin: 0,
                scale: 4,
                width: 200,
                color: {
                  dark: '#000000',
                  light: '#ffffff'
                }
              }}
            />
          </CardBody>
        </Card>
      </Tooltip>
    </>
  )
}

export default Login
