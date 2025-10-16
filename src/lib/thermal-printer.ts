// Thermal Printer Utility for POS System

// WebUSB API type declarations
declare global {
  interface Navigator {
    usb?: {
      getDevices(): Promise<USBDevice[]>;
      requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
    };
  }
}

interface USBDevice {
  productName?: string;
  manufacturerName?: string;
  open(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
}

interface USBDeviceFilter {
  classCode?: number;
  vendorId?: number;
}

interface OrderItem {
  product: {
    name: string;
    price: string | number;
  };
  quantity: number;
}

interface OrderData {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  orderType: string;
  paymentMethod: string;
  discountAmount?: number;
}

export class ThermalPrinter {
  private static instance: ThermalPrinter;
  private isConnected = false;
  private printerName = '';

  private constructor() {}

  static getInstance(): ThermalPrinter {
    if (!ThermalPrinter.instance) {
      ThermalPrinter.instance = new ThermalPrinter();
    }
    return ThermalPrinter.instance;
  }

  // Check if thermal printer is available
  async checkPrinterAvailability(): Promise<boolean> {
    try {
      // Check if WebUSB is available
      if (!navigator.usb) {
        console.log('WebUSB not supported');
        return false;
      }

      // Try to get connected devices
      const devices = await navigator.usb.getDevices();
      const printerDevice = devices.find(device => 
        device.productName?.toLowerCase().includes('printer') ||
        device.productName?.toLowerCase().includes('thermal') ||
        device.manufacturerName?.toLowerCase().includes('epson') ||
        device.manufacturerName?.toLowerCase().includes('star')
      );

      if (printerDevice) {
        this.isConnected = true;
        this.printerName = printerDevice.productName || 'Thermal Printer';
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking printer availability:', error);
      return false;
    }
  }

  // Connect to thermal printer
  async connectToPrinter(): Promise<boolean> {
    try {
      if (!navigator.usb) {
        throw new Error('WebUSB not supported');
      }

      // Request access to USB device
      const device = await navigator.usb.requestDevice({
        filters: [
          { classCode: 7 }, // Printer class
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x0519 }, // Star Micronics
        ]
      });

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      this.isConnected = true;
      this.printerName = device.productName || 'Thermal Printer';
      return true;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      return false;
    }
  }

  // Print thermal receipt
  async printReceipt(orderData: OrderData): Promise<boolean> {
    try {
      if (!this.isConnected) {
        const connected = await this.connectToPrinter();
        if (!connected) {
          throw new Error('Printer not connected');
        }
      }

      // Generate thermal receipt content
      const receiptContent = this.generateThermalReceipt(orderData);
      
      // For now, we'll use the browser's print functionality with thermal-specific CSS
      // In a real implementation, you would send data directly to the USB printer
      await this.printToBrowser(receiptContent);
      
      return true;
    } catch (error) {
      console.error('Error printing receipt:', error);
      return false;
    }
  }

  // Generate thermal receipt content
  private generateThermalReceipt(orderData: OrderData): string {
    const items = orderData.items.map((item: OrderItem) => 
      `${item.quantity}x ${item.product.name} - ₨${(Number(item.product.price) * item.quantity).toFixed(2)}`
    ).join('\n');

    return `
================================
    ZAALIMMMM SHAWARMA
================================

Order #: ${orderData.orderNumber}
Customer: ${orderData.customerName || 'Walk-in Customer'}
Date: ${new Date().toLocaleString()}
Type: ${orderData.orderType}
Payment: ${orderData.paymentMethod}

--------------------------------
ITEMS:
${items}
--------------------------------

${orderData.discountAmount && orderData.discountAmount > 0 ? `Discount: -₨${orderData.discountAmount}\n` : ''}
TOTAL: ₨${orderData.total.toFixed(2)}

Thank you for choosing Zaalimmmm!
================================
    `;
  }

  // Print to browser with thermal-specific styling
  private async printToBrowser(content: string): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${content.match(/Order #: (.+)/)?.[1] || 'Order'}</title>
          <style>
            @page {
              size: 80mm 200mm;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 5mm;
              width: 70mm;
              white-space: pre-line;
              color: #000;
              background: #fff;
            }
            .header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .divider {
              border-top: 1px solid #000;
              margin: 5px 0;
            }
            .total {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
            }
            @media print {
              body {
                margin: 0;
                padding: 2mm;
                width: 76mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>ZAALIMMMM SHAWARMA</div>
          </div>
          <div class="divider"></div>
          ${content}
          <div class="footer">
            <div>Thank you for choosing Zaalimmmm!</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
      // Close window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  }

  // Get printer status
  getStatus(): { connected: boolean; name: string } {
    return {
      connected: this.isConnected,
      name: this.printerName
    };
  }

  // Disconnect printer
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.printerName = '';
  }
}

// Export singleton instance
export const thermalPrinter = ThermalPrinter.getInstance();
