import { Injectable } from '@nestjs/common';
import { DeviceType } from '@prisma/client'; 

// export enum DeviceType {
//     IOS = 'IOS',
//     ANDROID = 'ANDROID',
//     WEB = 'WEB',
// }


export interface DeviceInfo {
    deviceType: DeviceType;
    os: string;
    browser: string;
    deviceName: string;
    browserName: string;
    osName: string;
}

@Injectable()
export class DeviceDetectionService {

    


    detectDeviceInfo(userAgent: string): DeviceInfo {
        const ua = userAgent?.toLowerCase() || '';

        const deviceType = this.detectDeviceType(ua);

        const os = this.detectOS(ua);

        const browser = this.detectBrowser(ua);

        const deviceName = this.detectDeviceName(ua, os);

        return {
            deviceType,
            os,
            browser,
            deviceName,
            browserName: browser,
            osName: os,
        };
    }





    detectDeviceType(userAgent: string): DeviceType {
        const ua = userAgent?.toLowerCase() || '';

        if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
            return DeviceType.IOS;
        }

        if (ua.includes('android')) {
            return DeviceType.ANDROID;
        }

        if (ua.includes('mobile') || ua.includes('tablet')) {
            return DeviceType.WEB;
        }

        return DeviceType.WEB;
    }





    detectOS(userAgent: string): string {
        const ua = userAgent?.toLowerCase() || '';

        // Windows
        if (ua.includes('windows nt 10.0')) return 'Windows 11/10';
        if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
        if (ua.includes('windows nt 6.2')) return 'Windows 8';
        if (ua.includes('windows nt 6.1')) return 'Windows 7';
        if (ua.includes('windows nt 6.0')) return 'Windows Vista';
        if (ua.includes('windows nt 5.1')) return 'Windows XP';

        // macOS
        if (ua.includes('mac os x 10_15')) return 'macOS Catalina';
        if (ua.includes('mac os x 10_14')) return 'macOS Mojave';
        if (ua.includes('mac os x 10_13')) return 'macOS High Sierra';
        if (ua.includes('mac os x 10_12')) return 'macOS Sierra';
        if (ua.includes('mac os x')) return 'macOS';

        // iOS
        if (ua.includes('iphone os 16')) return 'iOS 16';
        if (ua.includes('iphone os 15')) return 'iOS 15';
        if (ua.includes('iphone os 14')) return 'iOS 14';
        if (ua.includes('iphone os')) return 'iOS';

        // Android
        if (ua.includes('android 14')) return 'Android 14';
        if (ua.includes('android 13')) return 'Android 13';
        if (ua.includes('android 12')) return 'Android 12';
        if (ua.includes('android 11')) return 'Android 11';
        if (ua.includes('android 10')) return 'Android 10';
        if (ua.includes('android')) return 'Android';

        // Linux & Chrome OS
        if (ua.includes('linux')) return 'Linux';
        if (ua.includes('cros')) return 'Chrome OS';

        return 'Unknown OS';
    }






    detectBrowser(userAgent: string): string {
        const ua = userAgent?.toLowerCase() || '';

        // Edge
        if (ua.includes('edge') || ua.includes('edg/')) {
            const version = this.extractVersion(ua, 'edg/');
            return `Edge ${version}`;
        }

        // Opera
        if (ua.includes('opr/') || ua.includes('opera')) {
            const version = this.extractVersion(ua, 'opr/');
            return `Opera ${version}`;
        }

        // Brave
        if (ua.includes('brave')) {
            const version = this.extractVersion(ua, 'brave/');
            return `Brave ${version}`;
        }

        // Vivaldi
        if (ua.includes('vivaldi')) {
            const version = this.extractVersion(ua, 'vivaldi/');
            return `Vivaldi ${version}`;
        }

        // Samsung Internet
        if (ua.includes('samsungbrowser')) {
            const version = this.extractVersion(ua, 'samsungbrowser/');
            return `Samsung Internet ${version}`;
        }

        // UC Browser
        if (ua.includes('ucbrowser')) {
            const version = this.extractVersion(ua, 'ucbrowser/');
            return `UC Browser ${version}`;
        }

        // Firefox
        if (ua.includes('firefox') && !ua.includes('seamonkey')) {
            const version = this.extractVersion(ua, 'firefox/');
            return `Firefox ${version}`;
        }

        // Chrome
        if (ua.includes('chrome') && !ua.includes('edge') && !ua.includes('opr')) {
            const version = this.extractVersion(ua, 'chrome/');
            return `Chrome ${version}`;
        }

        // Safari
        if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('edge')) {
            const version = this.extractVersion(ua, 'version/');
            return `Safari ${version}`;
        }

        // Internet Explorer
        if (ua.includes('trident') || ua.includes('msie')) {
            return 'Internet Explorer';
        }

        return 'Unknown Browser';
    }




    detectDeviceName(userAgent: string, os: string): string {
        const ua = userAgent?.toLowerCase() || '';

        // iOS
        if (ua.includes('iphone')) {
            if (ua.includes('iphone15')) return 'iPhone 15';
            if (ua.includes('iphone14')) return 'iPhone 14';
            if (ua.includes('iphone13')) return 'iPhone 13';
            if (ua.includes('iphone12')) return 'iPhone 12';
            if (ua.includes('iphone11')) return 'iPhone 11';
            if (ua.includes('iphone xs')) return 'iPhone XS';
            if (ua.includes('iphone xr')) return 'iPhone XR';
            if (ua.includes('iphone x')) return 'iPhone X';
            return 'iPhone';
        }

        if (ua.includes('ipad')) return 'iPad';
        if (ua.includes('ipod')) return 'iPod Touch';

        // Android
        if (ua.includes('samsung') || ua.includes('sm-')) {
            if (ua.includes('s23')) return 'Samsung Galaxy S23';
            if (ua.includes('s22')) return 'Samsung Galaxy S22';
            if (ua.includes('s21')) return 'Samsung Galaxy S21';
            if (ua.includes('s20')) return 'Samsung Galaxy S20';
            if (ua.includes('note20')) return 'Samsung Galaxy Note 20';
            if (ua.includes('note10')) return 'Samsung Galaxy Note 10';
            if (ua.includes('fold')) return 'Samsung Galaxy Fold';
            if (ua.includes('flip')) return 'Samsung Galaxy Flip';
            return 'Samsung Galaxy';
        }

        if (ua.includes('pixel')) {
            if (ua.includes('pixel 8')) return 'Google Pixel 8';
            if (ua.includes('pixel 7')) return 'Google Pixel 7';
            if (ua.includes('pixel 6')) return 'Google Pixel 6';
            return 'Google Pixel';
        }

        if (ua.includes('oneplus')) return 'OnePlus';
        if (ua.includes('xiaomi') || ua.includes('redmi')) return 'Xiaomi';
        if (ua.includes('huawei')) return 'Huawei';

        // Desktop
        if (os.includes('Windows')) return 'Desktop PC';
        if (os.includes('macOS')) return 'Mac';
        if (os.includes('Linux')) return 'Linux PC';
        if (os.includes('Chrome OS')) return 'Chromebook';

        return 'Unknown Device';
    }





    private extractVersion(userAgent: string, prefix: string): string {
        const match = userAgent.match(new RegExp(`${prefix}(\\d+(\\.\\d+)?)`));
        if (match) {
            return match[1];
        }
        return '';
    }





    isNewDevice(
        currentDeviceType: DeviceType,
        existingSessions: { deviceType: DeviceType | null }[],
    ): boolean {
        return !existingSessions.some(
            (session) => session.deviceType === currentDeviceType,
        );
    }
}