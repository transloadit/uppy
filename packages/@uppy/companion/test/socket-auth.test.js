import { createServer } from 'node:http'
import { once } from 'node:events'
import { describe, expect, test, vi } from 'vitest'
import WebSocket from 'ws'
import socket from '../src/server/socket.js'

describe('socket onConnection authentication', () => {
  test('should call onConnection callback when provided', async () => {
    const server = createServer()
    const onConnectionMock = vi.fn()
    
    // Setup socket with onConnection callback
    socket(server, { onConnection: onConnectionMock })
    
    // Start server on available port
    server.listen(0)
    await once(server, 'listening')
    
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address?.port || 0
    
    try {
      // Create WebSocket connection
      const ws = new WebSocket(`ws://localhost:${port}/api/test-token`)
      
      // Wait for connection to be established
      await once(ws, 'open')
      
      // Verify onConnection was called
      expect(onConnectionMock).toHaveBeenCalledTimes(1)
      expect(onConnectionMock).toHaveBeenCalledWith(
        expect.any(Object), // WebSocket instance
        expect.any(Object)  // Request object
      )
      
      ws.close()
    } finally {
      server.close()
    }
  })

  test('should close connection when onConnection throws error', async () => {
    const server = createServer()
    const onConnectionMock = vi.fn().mockRejectedValue(new Error('Unauthorized'))
    
    // Setup socket with failing onConnection callback
    socket(server, { onConnection: onConnectionMock })
    
    // Start server on available port
    server.listen(0)
    await once(server, 'listening')
    
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address?.port || 0
    
    try {
      // Create WebSocket connection
      const ws = new WebSocket(`ws://localhost:${port}/api/test-token`)
      
      // Wait for connection to be closed
      const closeEvent = await once(ws, 'close')
      
      // Verify connection was closed with authentication error code
      expect(closeEvent[0]).toBe(1008) // 1008 = Policy Violation
      expect(closeEvent[1].toString()).toBe('Authentication failed')
      
      // Verify onConnection was called
      expect(onConnectionMock).toHaveBeenCalledTimes(1)
    } finally {
      server.close()
    }
  })

  test('should work normally without onConnection callback', async () => {
    const server = createServer()
    
    // Setup socket without onConnection callback
    socket(server, {})
    
    // Start server on available port
    server.listen(0)
    await once(server, 'listening')
    
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address?.port || 0
    
    try {
      // Create WebSocket connection
      const ws = new WebSocket(`ws://localhost:${port}/api/test-token`)
      
      // Wait for connection to be established
      await once(ws, 'open')
      
      // Connection should be successful
      expect(ws.readyState).toBe(WebSocket.OPEN)
      
      ws.close()
    } finally {
      server.close()
    }
  })

  test('should pass correct WebSocket and request objects to onConnection', async () => {
    const server = createServer()
    let capturedWs, capturedReq
    
    const onConnectionMock = vi.fn((ws, req) => {
      capturedWs = ws
      capturedReq = req
    })
    
    // Setup socket with onConnection callback
    socket(server, { onConnection: onConnectionMock })
    
    // Start server on available port
    server.listen(0)
    await once(server, 'listening')
    
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address?.port || 0
    
    try {
      // Create WebSocket connection with specific URL
      const ws = new WebSocket(`ws://localhost:${port}/api/specific-token`)
      
      // Wait for connection to be established
      await once(ws, 'open')
      
      // Verify the captured objects
      expect(capturedWs).toBeDefined()
      expect(capturedReq).toBeDefined()
      // @ts-ignore - capturedReq is checked above
      expect(capturedReq.url).toBe('/api/specific-token')
      
      ws.close()
    } finally {
      server.close()
    }
  })
})