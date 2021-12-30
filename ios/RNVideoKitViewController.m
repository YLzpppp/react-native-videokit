//
//  RNVideoKitViewController.m
//  Videokit
//
//  Created by lzp on 2021/2/20.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "RNVideoKitViewController.h"
#import "DeviceOrientation.h"

@implementation RNVideoKitViewController

- (instancetype) init {
  if (self = [super init]){
	self.autoHidden = false;
  }
  return self;
}

- (BOOL)prefersHomeIndicatorAutoHidden {
  return _autoHidden;
}
- (BOOL)prefersStatusBarHidden{
  return NO;
}

- (BOOL)shouldAutorotate {
  return true;
}
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
 return [DeviceOrientation getOrientation];
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
  return UIInterfaceOrientationPortrait;
}

@end
